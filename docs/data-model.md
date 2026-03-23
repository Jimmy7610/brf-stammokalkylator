# Föreslagen datamodell

## Översikt

Den framtida lösningen bör separera förening, fastigheter, medlemmar, möten och utskick. Det gör att flera adresser, flera hus och olika roller kan hanteras korrekt.

## Entiteter

### Association

Representerar en bostadsrättsförening.

Fält:

- `id`
- `name`
- `org_number`
- `default_call_rule`
- `created_at`
- `updated_at`

### PropertyAddress

Representerar en adress eller byggnad inom föreningen.

Fält:

- `id`
- `association_id`
- `street`
- `street_number`
- `postal_code`
- `city`
- `label`

### Unit

Representerar en lägenhet eller lokal.

Fält:

- `id`
- `association_id`
- `property_address_id`
- `unit_number`
- `share_number`
- `default_vote_weight`

### Member

Representerar en medlem eller delägare.

Fält:

- `id`
- `association_id`
- `unit_id`
- `full_name`
- `email`
- `phone`
- `email_consent`
- `active`
- `notes`
- `created_at`
- `updated_at`

### User

Representerar inloggningskonto.

Fält:

- `id`
- `association_id`
- `email`
- `password_hash`
- `role`
- `last_login_at`

Roller:

- `owner`
- `board_admin`
- `board_member`
- `viewer`

### Meeting

Representerar en stämma.

Fält:

- `id`
- `association_id`
- `type`
- `title`
- `meeting_date`
- `meeting_location`
- `agenda_text`
- `call_rule`
- `status`
- `created_by_user_id`
- `created_at`
- `updated_at`

### MeetingDocument

Representerar dokument kopplade till en stämma.

Fält:

- `id`
- `meeting_id`
- `title`
- `file_url`
- `document_type`
- `available_from`

### Invitation

Representerar distribution av kallelse till en medlem.

Fält:

- `id`
- `meeting_id`
- `member_id`
- `channel`
- `status`
- `subject`
- `sent_at`
- `opened_at`
- `delivery_reference`

Status:

- `draft`
- `scheduled`
- `sent`
- `opened`
- `failed`

### RSVP

Representerar svar inför stämman.

Fält:

- `id`
- `meeting_id`
- `member_id`
- `response`
- `responded_at`
- `comment`

Svar:

- `pending`
- `attending`
- `not_attending`
- `proxy`

### ProxyAuthorization

Representerar fullmakt eller ombud.

Fält:

- `id`
- `meeting_id`
- `member_id`
- `proxy_name`
- `proxy_email`
- `document_url`
- `document_note`
- `validated_by_user_id`
- `validated_at`

### Attendance

Representerar faktisk incheckning på stämman.

Fält:

- `id`
- `meeting_id`
- `member_id`
- `status`
- `checked_in_at`
- `checked_in_by_user_id`

Status:

- `unchecked`
- `present`
- `proxy`
- `absent`

### VotingRollEntry

Representerar slutlig röstlängd för stämman.

Fält:

- `id`
- `meeting_id`
- `member_id`
- `represented_by_name`
- `vote_weight`
- `proxy_authorization_id`
- `locked_at`

### AuditLog

Representerar viktiga säkerhets- och affärshändelser.

Fält:

- `id`
- `association_id`
- `user_id`
- `action`
- `entity_type`
- `entity_id`
- `metadata_json`
- `created_at`

## Viktiga relationer

- en `Association` har många `PropertyAddress`
- en `PropertyAddress` har många `Unit`
- en `Unit` har många `Member`
- en `Association` har många `Meeting`
- en `Meeting` har många `Invitation`, `RSVP`, `ProxyAuthorization`, `Attendance` och `VotingRollEntry`

## Designprinciper

- känslig data ska lagras server-side
- samtycken ska vara egna fält och revisionsbara
- fullmakter ska kunna verifieras och kopplas till dokument
- röstlängd ska kunna låsas när stämman börjar
- alla viktiga ändringar ska kunna audit-loggas
