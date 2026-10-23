#!/bin/sh
set -eu
postconf -e 'myhostname=ebikeland.id' 'myorigin=ebikeland.id' \
  'mydestination=localhost' 'inet_interfaces=all' 'inet_protocols=ipv4' \
  'mynetworks=127.0.0.0/8 10.89.10.0/24' \
  'smtpd_relay_restrictions=permit_mynetworks,reject_unauth_destination' \
  'smtp_tls_security_level=may' 'smtp_tls_CAfile=/etc/ssl/certs/ca-certificates.crt' \
  'maillog_file=/dev/stdout' 'compatibility_level=3.6'
exec postfix start-fg
