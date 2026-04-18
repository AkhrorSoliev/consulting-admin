# Candidate stages

The 4-stage pipeline every candidate moves through. Constants defined in [src/constants/candidateStatus.js](../../src/constants/candidateStatus.js).

For the flow between stages see [../explanation/candidate-lifecycle.md](../explanation/candidate-lifecycle.md).

---

## Stage table

| Key | Short label | Long label (Uzbek) | Badge color | Meaning |
|---|---|---|---|---|
| `stage_1` | `1-bosqich` | Ichki suhbat — kutilmoqda | `primary` | Internal interview pending |
| `stage_2` | `2-bosqich` | Ichki suhbat natijasi | `info` | Internal interview completed, awaiting management decision |
| `stage_2_result` | `2-bosqich+` | Management qarori | `info` | Management review result recorded |
| `stage_3` | `3-bosqich` | Ish beruvchi bilan intervyu | `warning` | Invited to interview with employer |
| `stage_4` | `4-bosqich` | Ish beruvchi qarori | `success` | Employer decision recorded |

The short labels are what appear in the candidate table's Status column.

---

## Outcome model

Every stage can carry an outcome:

- `accepted` → candidate advances to the next stage.
- `rejected` → candidate is archived; automated rejection email is sent; Telegram auto-remove triggers if `telegramId` is set.
- _(unset)_ → decision pending.

Stored in `stageOutcome` object on the candidate document:

```json
{
  "stage": "stage_3",
  "stageOutcome": {
    "stage_1": "accepted",
    "stage_2": "accepted",
    "stage_3": "accepted"
  }
}
```

When `stage_4.stageOutcome = "accepted"`, the candidate is **placed**. They stay in their major's collection with all history intact — no separate "placed" collection.

---

## Email templates per outcome

Each stage/outcome combination maps to an email template in `settings/email_templates`:

| Key | Trigger |
|---|---|
| `stage_1_accepted` | Internal interview passed, moving to management review |
| `stage_1_rejected` | Internal interview failed |
| `stage_2_accepted` | Moving to employer interview |
| `stage_2_rejected` | Management declined |
| `stage_3_accepted` | Employer interview passed |
| `stage_3_rejected` | Employer declined OR candidate withdrew |
| `stage_4_accepted` | **Placed!** |
| `stage_4_rejected` | Final employer decision: no |

Template body supports variables: `{firstName}`, `{lastName}`, `{email}`, `{phone}`, major-specific substitutions. Previewed before send.

---

## Filter behavior in `/collectionCv/:major`

Stage filter has 5 choices (one per stage key). Stage-outcome filter has 11 choices (accepted + rejected for each of the 5 stage keys, plus "any").

Candidates at `stage: "stage_4"` with `stageOutcome.stage_4 = "accepted"` match the "Stage 4 accepted" filter — effectively a "placed candidates" shortcut.
