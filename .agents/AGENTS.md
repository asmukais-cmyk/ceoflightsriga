# CEOFLIGHTS Riga — Agent Rules

## Asana Integration
- **NEVER use the browser to check Asana tasks.** Always use the Asana REST API with the PAT.
- The Asana Personal Access Token (PAT) is stored in `.env` as `ASANA_PAT`.
- When the user asks to read, check, or interact with Asana tasks, read the PAT from `.env` and use it with the Asana REST API (`https://app.asana.com/api/1.0/`).
- The PAT is for user **Agris** (gid: `1199503305092665`), but the workspace owner is **Austin CEOFLIGHTS**.
- The main project is **ceoflights.com** (gid: `1199733399913981`).
- Common API patterns:
  - Task details: `GET /tasks/{task_gid}?opt_fields=name,notes,html_notes,assignee.name,due_on,completed,memberships.section.name,subtasks,created_at,modified_at,followers.name`
  - Comments: `GET /tasks/{task_gid}/stories?opt_fields=created_by.name,created_at,text,type,resource_subtype`
  - Post comment: `POST /tasks/{task_gid}/stories` with `{"data":{"text":"..."}}`
- Always use `Authorization: Bearer {PAT}` header.
