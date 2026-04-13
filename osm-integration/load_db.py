#!/usr/bin/env python3
from math import asin, cos, radians, sin, sqrt
from os import getenv
from time import time

import argh
import osmium
from dotenv import load_dotenv
from py2neo import Graph
from py2neo.bulk import merge_relationships

from utils import clear_db

load_dotenv()


def haversine(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    r = 6371
    return c * r


def ensure_indexes(db: Graph):
    db.run(
        """
        CREATE CONSTRAINT node_id_unique IF NOT EXISTS
        FOR (n:Node)
        REQUIRE n.node_id IS UNIQUE
        """
    )
    db.run(
        """
        CREATE POINT INDEX node_location_idx IF NOT EXISTS
        FOR (n:Node)
        ON (n.location)
        """
    )


class FileHandler(osmium.SimpleHandler):
    def __init__(
        self,
        db: Graph,
        node_batch: int,
        relation_batch: int,
        fast_edges: bool = False,
        progress_every: int = 200000,
    ):
        super(FileHandler, self).__init__()
        self.db = db
        self.node_batch = node_batch
        self.relation_batch = relation_batch
        self.fast_edges = fast_edges
        self.progress_every = progress_every

        self.node_buffer = []
        self.edge_buffer = []

        self.node_count = 0
        self.edge_count = 0
        self.node_write_time = 0.0
        self.edge_write_time = 0.0
        self.started = time()
        self._next_node_log = progress_every
        self._next_edge_log = progress_every

    def node(self, n):
        if not n.location.valid():
            return

        self.node_buffer.append(
            {
                "node_id": n.id,
                "lat": float(n.location.lat),
                "lon": float(n.location.lon),
            }
        )

        if len(self.node_buffer) >= self.node_batch:
            self.flush_nodes()

    def way(self, w):
        if len(w.nodes) < 2:
            return

        if w.nodes[0].ref == w.nodes[-1].ref:
            return

        for i in range(len(w.nodes) - 1):
            start = w.nodes[i]
            end = w.nodes[i + 1]
            if not start.location.valid() or not end.location.valid():
                continue

            distance = haversine(
                start.location.lon,
                start.location.lat,
                end.location.lon,
                end.location.lat,
            )
            self.edge_buffer.append(
                {
                    "start_node_id": start.ref,
                    "end_node_id": end.ref,
                    "distance": distance,
                    "rating": 4,
                    "cost": distance / 4,
                }
            )

            if len(self.edge_buffer) >= self.relation_batch:
                self.flush_edges()

    def flush_nodes(self):
        if not self.node_buffer:
            return

        started = time()
        self.db.run(
            """
            UNWIND $rows AS row
            CREATE (:Node {
                node_id: row.node_id,
                location: point({latitude: row.lat, longitude: row.lon})
            })
            """,
            rows=self.node_buffer,
        )
        self.node_write_time += time() - started
        self.node_count += len(self.node_buffer)
        self.node_buffer.clear()
        self._maybe_log_progress()

    def flush_edges(self):
        if not self.edge_buffer:
            return

        started = time()

        if self.fast_edges:
            self.db.run(
                """
                UNWIND $rows AS row
                MATCH (a:Node {node_id: row.start_node_id})
                MATCH (b:Node {node_id: row.end_node_id})
                CREATE (a)-[:Route {
                    distance: row.distance,
                    rating: row.rating,
                    cost: row.cost
                }]->(b)
                """,
                rows=self.edge_buffer,
            )
        else:
            merge_relationships(
                self.db.auto(),
                (
                    (
                        row["start_node_id"],
                        {
                            "distance": row["distance"],
                            "rating": row["rating"],
                            "cost": row["cost"],
                        },
                        row["end_node_id"],
                    )
                    for row in self.edge_buffer
                ),
                merge_key=("Route"),
                start_node_key=("Node", "node_id"),
                end_node_key=("Node", "node_id"),
            )

        self.edge_write_time += time() - started
        self.edge_count += len(self.edge_buffer)
        self.edge_buffer.clear()
        self._maybe_log_progress()

    def _maybe_log_progress(self):
        should_log_nodes = self.node_count >= self._next_node_log
        should_log_edges = self.edge_count >= self._next_edge_log
        if not should_log_nodes and not should_log_edges:
            return

        if should_log_nodes:
            while self.node_count >= self._next_node_log:
                self._next_node_log += self.progress_every

        if should_log_edges:
            while self.edge_count >= self._next_edge_log:
                self._next_edge_log += self.progress_every

        elapsed = time() - self.started
        print(
            f"progress {elapsed / 60:.2f}m | "
            f"nodes={self.node_count:,} edges={self.edge_count:,}"
        )

    def flush(self):
        self.flush_nodes()
        self.flush_edges()


def load(
    url: str = "http://download.geofabrik.de/europe/monaco-latest.osm.pbf",
    node_batch: int = 50000,
    relation_batch: int = 5000,
    clear: bool = False,
    fast_edges: bool = False,
    progress_every: int = 200000,
):
    """load osm file into neo4j database

    Args:
        url (str, optional): location of osm file, could be in the cloud.
        Defaults to "http://download.geofabrik.de/europe/monaco-latest.osm.pbf".
        node_batch (int, optional): size of batches for nodes. Defaults to 50000.
        relation_batch (int, optional): size of batches for relations. Defaults to 5000.
        clear (bool, optional): should database be cleared first. Defaults to False.
        fast_edges (bool, optional): insert edges with CREATE instead of MERGE.
        This is faster but may create duplicate Route relationships. Defaults to False.
        progress_every (int, optional): log progress every N inserted nodes/edges.
        Defaults to 200000.
    """
    start_time = time()
    db = Graph(getenv("CON_STRING"), auth=(getenv("CON_USER"), getenv("CON_PASS")))
    print("connected to db")

    if clear:
        clear_db(db)

    ensure_indexes(db)

    parse_started = time()
    osm_handler = FileHandler(
        db,
        node_batch,
        relation_batch,
        fast_edges=fast_edges,
        progress_every=progress_every,
    )
    osm_handler.apply_file(url, locations=True)
    osm_handler.flush()
    parse_time = time() - parse_started

    print(
        f"read file {url}, nodes: {osm_handler.node_count}, "
        f"relations: {osm_handler.edge_count}"
    )
    print(f"parse + import time: {parse_time / 60:.2f} minutes")
    print(f"node write time: {osm_handler.node_write_time / 60:.2f} minutes")
    print(f"relation write time: {osm_handler.edge_write_time / 60:.2f} minutes")

    print("creating gds graph")
    db.run("CALL gds.graph.drop('nodesGraph', false)")
    db.run(
        "CALL gds.graph.project( 'nodesGraph', 'Node', 'Route', "
        "{ relationshipProperties: ['rating', 'cost', 'distance'] } )"
    )

    print(f"total time: {(time() - start_time) / 60:.2f} minutes")


argh.dispatch_command(load)
