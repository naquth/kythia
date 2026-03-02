# 🎟️ Ticket Addon — Usage Guide

All ticket commands live under the `/ticket` slash command group. The command requires the **Manage Guild** permission to use.

---

## Table of Contents

- [Creating a Panel](#creating-a-panel)
- [Creating a Ticket Type (Category)](#creating-a-ticket-type-category)
- [Command Reference](#command-reference)
  - [Panel Commands](#panel-commands)
  - [Type Commands](#type-commands)
  - [Ticket Utility Commands](#ticket-utility-commands)

---

## Creating a Panel

A **panel** is the public-facing message posted in a channel that users interact with to open tickets. You must create at least one panel before adding ticket types to it.

**Command:** `/ticket panel create`

**Steps:**

1. Run `/ticket panel create` — the bot replies with a setup message containing a **Start Setup** button.
2. Click the button. A modal will appear with the following fields:

   | Field | Required | Description |
   |-------|----------|-------------|
   | **Panel Channel** | ✅ Yes | The text channel where the panel message will be posted |
   | **Panel Title** | ✅ Yes | The title shown on the panel (e.g. *Kythia Support Center*) |
   | **Panel Description** | No | Subtitle/description text displayed on the panel |
   | **Panel Image URL** | No | A banner image URL displayed at the top of the panel |

3. Submit the modal. The panel is created and posted in the selected channel automatically.

> **Note:** A panel with no ticket types will show an empty interaction menu. Make sure to add at least one type after creating the panel.

---

## Creating a Ticket Type (Category)

A **ticket type** is a category option inside a panel (e.g. *Bug Report*, *General Support*). Each type can be configured with its own staff role, log channel, transcript channel, category, and an optional reason prompt.

**Command:** `/ticket type create`

**Steps:**

**Step 1 — Basic Info**

1. Run `/ticket type create` — the bot replies with a setup message containing a **Start Setup** button.
2. Click the button. A modal titled **Create Type — Step 1/2: Basic Info** will appear:

   | Field | Required | Description |
   |-------|----------|-------------|
   | **Select Target Panel** | ✅ Yes | The panel this type will be added to (dropdown from your existing panels) |
   | **Ticket Type Name** | ✅ Yes | The label shown in the panel menu (e.g. *Bug Report*) |
   | **Type Emoji** | No | An emoji shown next to the type label (e.g. `🐛`) |
   | **Ticket Opening Message** | No | A message sent automatically when a new ticket of this type is opened |
   | **Ticket Opening Image** | No | An image URL shown in the opening message |

3. Submit Step 1. The bot will show a confirmation with a **Continue to Step 2** button.

**Step 2 — Configuration**

4. Click **Continue to Step 2**. A modal titled **Create Type — Step 2/2: Config** will appear:

   | Field | Required | Description |
   |-------|----------|-------------|
   | **Staff Role** | ✅ Yes | The role that gains access to every ticket of this type |
   | **Log Channel** | ✅ Yes | The channel where ticket events (open/close/claim) are logged |
   | **Transcript Channel** | ✅ Yes | The channel where transcripts are posted when a ticket is closed |
   | **Ticket Category** | No | A Discord channel category where new ticket channels are created |
   | **Reason Question** | No | If provided, users are prompted to fill in a reason before the ticket is opened. Leave empty to skip the prompt. |

5. Submit Step 2. The ticket type is created and the panel is automatically refreshed to include the new option.

---

## Command Reference

### Panel Commands

#### `/ticket panel create`
Starts the interactive panel creation wizard.
- No options required — everything is filled in via the interactive modal.

---

#### `/ticket panel delete`
Deletes a panel and **all ticket types** attached to it. The panel message in Discord is also deleted.

| Option | Required | Description |
|--------|----------|-------------|
| `panel_id` | ✅ Yes | Select the panel to delete (autocomplete by title or message ID) |

> ⚠️ **This action is irreversible.** All associated ticket types (and their configs) will be permanently removed.

---

#### `/ticket panel reload`
Refreshes a panel message to reflect the latest ticket types and configuration.

| Option | Required | Description |
|--------|----------|-------------|
| `message_id` | ✅ Yes | Select the panel to reload (autocomplete by title or message ID) |

Use this after manually editing a ticket type or if the panel appears out of sync.

---

### Type Commands

#### `/ticket type create`
Starts the interactive 2-step ticket type creation wizard. See [Creating a Ticket Type](#creating-a-ticket-type-category) above for the full walkthrough.
- No options required — everything is filled in via interactive modals.

---

#### `/ticket type delete`
Deletes a ticket type and automatically reloads the parent panel to remove the deleted option.

| Option | Required | Description |
|--------|----------|-------------|
| `type_id` | ✅ Yes | Select the ticket type to delete (autocomplete by type name) |

---

### Ticket Utility Commands

These commands are used **inside an open ticket channel**.

---

#### `/ticket add`
Adds a user to the current ticket channel by granting them **View Channel** permission. The user also receives a DM notification with a link to the ticket.

| Option | Required | Description |
|--------|----------|-------------|
| `user` | ✅ Yes | The user to add to the ticket |

---

#### `/ticket remove`
Removes a user from the current ticket channel by revoking their **View Channel** permission.

| Option | Required | Description |
|--------|----------|-------------|
| `user` | ✅ Yes | The user to remove from the ticket |

---

#### `/ticket close`
Closes the current ticket and deletes the ticket channel. Must be run inside an open ticket channel.

- No options required.
- The ticket status is updated to `closed` in the database.
- A close confirmation flow may be triggered depending on the ticket type configuration.

---

#### `/ticket transcript`
Generates a transcript of the current ticket and sends it to the configured **Transcript Channel** for the ticket type.

- No options required.
- The transcript is delivered as a `.txt` file attachment (max 6 MB).
- Must be run inside an open ticket channel.
- Requires a transcript channel to be configured on the ticket type.
