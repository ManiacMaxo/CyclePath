FROM node:lts as builder

WORKDIR /app/server
# caching installing dependencies
COPY ./server/yarn.lock ./server/package.json ./
RUN yarn install --frozen-lockfile && yarn cache clean

WORKDIR /app/client
# caching installing dependencies
COPY ./client/yarn.lock ./client/package.json ./
RUN yarn install --frozen-lockfile && yarn cache clean

WORKDIR /app/server
COPY server/ ./
RUN yarn build

WORKDIR /app/client
COPY client/ ./
ENV REACT_APP_API_URL=/api
RUN yarn build

FROM alpine

RUN apk add --update \
    nginx supervisor nodejs=16.14.0-r0 npm && \
    npm i -g yarn

RUN addgroup -S cyclepath && adduser -S cyclepath -G cyclepath
RUN install -dv -m 0755 -o cyclepath -g cyclepath /var/log/nginx /var/lib/nginx /var/lib/nginx/body
RUN chown -R cyclepath:cyclepath /var/log/nginx /var/lib/nginx

USER cyclepath

WORKDIR /app
COPY --from=builder --chown=cyclepath:cyclepath /app/server/dist ./server
COPY --from=builder --chown=cyclepath:cyclepath /app/client/build ./client

WORKDIR /app/server
COPY server/package.json server/yarn.lock ./
RUN yarn install --production && yarn cache clean

RUN mkdir -p /etc/
COPY ./docker/supervisord.conf /etc/supervisord.conf
COPY ./docker/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]