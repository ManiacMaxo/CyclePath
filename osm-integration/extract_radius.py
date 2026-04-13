#!/usr/bin/env python3
import math
from pathlib import Path

import argh
import osmium

EARTH_RADIUS_M = 6_371_000


def haversine_distance_m(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return EARTH_RADIUS_M * c


class RadiusCollector(osmium.SimpleHandler):
    def __init__(
        self, center_lon: float, center_lat: float, radius_m: float, strategy: str
    ):
        super().__init__()
        self.center_lon = center_lon
        self.center_lat = center_lat
        self.radius_m = radius_m
        self.strategy = strategy

        self.in_radius_nodes: set[int] = set()
        self.required_way_nodes: set[int] = set()
        self.kept_way_ids: set[int] = set()

    def node(self, n):
        if not n.location.valid():
            return

        dist = haversine_distance_m(
            self.center_lon,
            self.center_lat,
            float(n.location.lon),
            float(n.location.lat),
        )
        if dist <= self.radius_m:
            self.in_radius_nodes.add(n.id)

    def way(self, w):
        if len(w.nodes) < 2:
            return

        node_ids = [node.ref for node in w.nodes]
        hits = [node_id in self.in_radius_nodes for node_id in node_ids]

        if self.strategy == "strict":
            should_keep = all(hits)
        else:
            should_keep = any(hits)

        if should_keep:
            self.kept_way_ids.add(w.id)
            self.required_way_nodes.update(node_ids)


class RadiusWriter(osmium.SimpleHandler):
    def __init__(
        self,
        writer: osmium.SimpleWriter,
        nodes_to_keep: set[int],
        kept_way_ids: set[int],
        keep_relations: bool,
    ):
        super().__init__()
        self.writer = writer
        self.nodes_to_keep = nodes_to_keep
        self.kept_way_ids = kept_way_ids
        self.keep_relations = keep_relations

    def node(self, n):
        if n.id in self.nodes_to_keep:
            self.writer.add_node(n)

    def way(self, w):
        if w.id in self.kept_way_ids:
            self.writer.add_way(w)

    def relation(self, r):
        if not self.keep_relations:
            return

        for member in r.members:
            if member.type == "w" and member.ref in self.kept_way_ids:
                self.writer.add_relation(r)
                return


def extract_radius(
    in_file: str,
    out_file: str,
    lon: float,
    lat: float,
    radius_m: float,
    strategy: str = "complete_ways",
    keep_relations: bool = True,
    overwrite: bool = False,
):
    """Extract data around a coordinate from an .osm.pbf with pyosmium.

    Args:
        in_file: source .osm.pbf file path.
        out_file: output .osm.pbf file path.
        lon: center longitude in degrees.
        lat: center latitude in degrees.
        radius_m: extraction radius in meters.
        strategy: "complete_ways" keeps ways with at least one node in radius,
            "strict" keeps only ways whose all nodes are in radius.
        keep_relations: keep relations that reference selected ways.
        overwrite: overwrite output file if it already exists.
    """
    source = Path(in_file)
    if not source.exists():
        raise FileNotFoundError(f"input file not found: {in_file}")

    if strategy not in {"complete_ways", "strict"}:
        raise ValueError('strategy must be either "complete_ways" or "strict"')

    if radius_m <= 0:
        raise ValueError("radius_m must be greater than 0")

    destination = Path(out_file)
    if destination.exists():
        if not overwrite:
            raise FileExistsError(
                f"output file already exists: {out_file}. Use overwrite=True to replace it."
            )
        destination.unlink()

    collector = RadiusCollector(
        center_lon=lon,
        center_lat=lat,
        radius_m=radius_m,
        strategy=strategy,
    )
    collector.apply_file(in_file, locations=True)

    writer = osmium.SimpleWriter(out_file)
    try:
        nodes_to_keep = collector.in_radius_nodes | collector.required_way_nodes
        rewrite = RadiusWriter(
            writer=writer,
            nodes_to_keep=nodes_to_keep,
            kept_way_ids=collector.kept_way_ids,
            keep_relations=keep_relations,
        )
        rewrite.apply_file(in_file, locations=False)
    finally:
        writer.close()

    print(
        f"extracted radius={radius_m}m around ({lat}, {lon}) from {in_file} to {out_file}"
    )
    print(f"kept nodes in radius: {len(collector.in_radius_nodes)}")
    print(f"kept ways: {len(collector.kept_way_ids)}")


argh.dispatch_command(extract_radius)
