ARG PHP_VERSION=8.3
FROM wordpress:php${PHP_VERSION}-apache
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends msmtp ca-certificates && rm -rf /var/lib/apt/lists/*
COPY php.ini /usr/local/etc/php/conf.d/odong.ini
COPY apache.conf /etc/apache2/conf-enabled/odong.conf
COPY msmtprc /etc/msmtprc
