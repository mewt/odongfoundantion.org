FROM debian:bookworm-slim
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends postfix ca-certificates && rm -rf /var/lib/apt/lists/*
COPY entrypoint.sh /usr/local/bin/mail-entrypoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/25; read -r reply <&3; [[ "$reply" == 220* ]]'
CMD ["sh", "/usr/local/bin/mail-entrypoint"]
