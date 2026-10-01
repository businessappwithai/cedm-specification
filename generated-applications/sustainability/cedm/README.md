# CEDM specification

This application was generated from a model built on CEDM, the Common
Enterprise Domain Model. The files here are the specification it was built
against, bundled into every generated application so the contract travels
with the code:

- `specification/` — vocabulary, lifecycle, business-rule, authorization, reporting and generation semantics, and the application profile
- `schema/` — the shape of a CEDM entity
- `domains/` — the domain and capability catalogs
- `entities/` — the library entity definitions this application imports
- `applications/` — the application modules the model imports

Nothing in the application reads these files at run time. The model itself is
in `../model/`.
