# Security

## Scope

neo-home v0 is a local-only surface. It binds to `127.0.0.1` and has no
authentication, no authorization boundary, and no encryption. Actor identity is
an honour system: anyone who can reach the port can write records.

**Do not expose the server to a network, a tunnel, or a public interface.**

## Data

Records live in `data/records.jsonl` and are never committed. Do not put
personal, customer, payment, or tax data in a record. The store does not encrypt
at rest; protect the host and the file permissions.

## Reporting

Open a private security advisory in the repository, or contact the ExOS
maintainers directly. Do not open a public issue for a vulnerability.
