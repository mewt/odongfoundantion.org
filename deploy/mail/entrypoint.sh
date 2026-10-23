#!/bin/sh
set -eu
chmod 755 /var/spool/postfix
postconf -e 'myhostname=ebikeland.id' 'myorigin=ebikeland.id' \
  'mydestination=localhost' 'inet_interfaces=all' 'inet_protocols=ipv4' \
  'mynetworks=127.0.0.0/8 10.89.10.0/24' \
  'smtpd_relay_restrictions=permit_mynetworks,reject_unauth_destination' \
  'smtp_tls_security_level=may' 'smtp_tls_CAfile=/etc/ssl/certs/ca-certificates.crt' \
  'maillog_file=/dev/stdout' 'compatibility_level=3.6'
postconf -F 'smtp/inet/chroot=n' 'smtp/unix/chroot=n' 'relay/unix/chroot=n'
exec postfix start-fg
