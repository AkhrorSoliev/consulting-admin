import { FaTelegram } from "react-icons/fa";
import { LANG_CERT_TYPES } from "../constants/formDefaults";
import { updateDocument } from "../../../utils";
import PersonalInfoFields from "./PersonalInfoFields";
import FormSectionsPanel from "./FormSectionsPanel";
import CommentSection from "./CommentSection";
import LivePreview from "./LivePreview";

export default function GenerateFormContent({ g, toInputDate, fromInputDate }) {
  return (
    <>
      <div className={g.layoutClass}>
        <section className={g.formSectionClass}>
          <div className="card-body space-y-4 min-h-[calc(100vh-2rem)]pb-4">
            <FormHeader docCv={g.docCv} />

            {g.isLimitedAdmin && (
              <LimitedAdminPhoto photo={g.photo} openPhotoModal={g.openPhotoModal} />
            )}

            <PersonalInfoFields
              {...g}
              toInputDate={toInputDate}
              fromInputDate={fromInputDate}
            />

            <FormSectionsPanel
              {...g}
              updateDocument={updateDocument}
              LANG_CERT_TYPES={LANG_CERT_TYPES}
            />

            {!g.isLimitedAdmin && (
              <CommentSection {...g} isLimitedAdmin={false} />
            )}

            {!g.isLimitedAdmin && (
              <>
                <div className="divider" />
                <div className="flex justify-end gap-2" />
              </>
            )}
          </div>
        </section>

        {g.isLimitedAdmin && (
          <CommentSection {...g} isLimitedAdmin={true} />
        )}

        {!g.isLimitedAdmin && (
          <LivePreview
            formCv={g.formCv}
            commentMeta={g.commentMeta}
            showDocuments={g.showDocuments}
            showComment={g.showComment}
            showCommentDate={g.showCommentDate}
            onPhotoClick={g.openPhotoModal}
            rating={g.rating}
          />
        )}
      </div>
    </>
  );
}

function FormHeader({ docCv }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h2 className="card-title text-2xl font-bold">Daten bearbeiten</h2>
        {docCv?.telegramId ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0088cc]/10 text-[#0088cc] text-sm font-medium"
            title="Über Telegram registriert"
          >
            <FaTelegram className="w-3.5 h-3.5" />
            <span className="text-xs">Telegram</span>
          </span>
        ) : null}
        {docCv?.lead ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-sm font-medium"
            title={`Lead: ${docCv.lead}`}
          >
            <span className="text-xs font-semibold">{docCv.lead}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function LimitedAdminPhoto({ photo, openPhotoModal }) {
  return (
    <div className="flex justify-center">
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-base-content/60">
          Profilfoto
        </p>
        {photo ? (
          <button
            type="button"
            className="rounded-md border border-base-300 overflow-hidden shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={openPhotoModal}
          >
            <img
              src={photo}
              alt="Kandidatenfoto"
              className="w-[128pt] h-[160pt] object-cover"
            />
          </button>
        ) : (
          <div className="w-[128pt] h-[160pt] border border-dashed border-base-300 rounded-md bg-base-200 flex items-center justify-center text-xs uppercase tracking-wide text-base-content/60">
            Kein Foto vorhanden
          </div>
        )}
        {photo && (
          <button
            type="button"
            className="btn btn-xs btn-primary"
            onClick={openPhotoModal}
          >
            Vergrößern
          </button>
        )}
      </div>
    </div>
  );
}
