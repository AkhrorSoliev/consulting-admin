/**
 * Home - Main page showing a table of Majors (Berufsfelder).
 */

import { Link } from "react-router-dom";
import { IoMdAddCircle } from "react-icons/io";
import { FaRegCopy, FaTrash, FaCog } from "react-icons/fa";
import MajorModal from "../components/MajorModal";
import LinkCopyModal from "../components/LinkCopyModal";
import MajorSettingsModal from "../components/MajorSettingsModal";
import { buildCreateLink } from "../components/majorsHelpers";
import {
  DeleteMajorModal,
  useMajorsData,
  resolveMajorCount,
  resolveMajorKey,
} from "../components/majorsList/index";

function Home() {
  const {
    filteredMajors,
    serverCounts,
    loadingCounts,
    togglingMajorId,
    setSettingsMajor,
    linkCopyModal,
    setLinkCopyModal,
    deleteMajorModal,
    setDeleteMajorModal,
    isLimitedAdmin,
    isSettingsOpen,
    settingsMajorKey,
    currentSettingsMajor,
    handleCopyLink,
    handleDeleteMajor,
    handleToggleCreateLink,
  } = useMajorsData();

  const addMajor = () => {
    document.getElementById("my_modal_5").showModal();
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <MajorModal />
      <LinkCopyModal
        open={linkCopyModal.open}
        onClose={() => setLinkCopyModal({ open: false, major: null })}
        regularLink={
          linkCopyModal.major ? buildCreateLink(linkCopyModal.major) : ""
        }
        majorCode={
          linkCopyModal.major
            ? linkCopyModal.major?.linkId ||
              linkCopyModal.major?.uuid ||
              linkCopyModal.major?.id ||
              linkCopyModal.major?.collectionName ||
              linkCopyModal.major
            : ""
        }
      />
      <DeleteMajorModal
        deleteMajorModal={deleteMajorModal}
        setDeleteMajorModal={setDeleteMajorModal}
        onDelete={handleDeleteMajor}
      />
      {!isLimitedAdmin && (
        <MajorSettingsModal
          open={isSettingsOpen}
          major={currentSettingsMajor}
          majorKey={settingsMajorKey}
          isTogglingLink={Boolean(
            settingsMajorKey && togglingMajorId === settingsMajorKey,
          )}
          onClose={() => setSettingsMajor(null)}
          onCopyLink={() => handleCopyLink(currentSettingsMajor)}
          onToggleLinkActive={(checked) =>
            handleToggleCreateLink(currentSettingsMajor, checked)
          }
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Berufsfelder</h1>
          <p className="text-sm text-base-content/60">
            {filteredMajors.length} Berufsfeld
            {filteredMajors.length !== 1 ? "er" : ""} insgesamt
          </p>
        </div>
        {!isLimitedAdmin && (
          <button onClick={addMajor} className="btn btn-primary gap-2">
            <IoMdAddCircle className="text-xl" />
            Neues Berufsfeld
          </button>
        )}
      </div>

      {/* Table */}
      {filteredMajors.length === 0 ? (
        <div className="text-center opacity-70 py-16 text-sm">
          <p>Derzeit keine Berufsfelder vorhanden.</p>
          {!isLimitedAdmin && (
            <p className="mt-1">
              Klicken Sie auf &bdquo;Neues Berufsfeld&ldquo;, um zu beginnen.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-300 shadow-sm">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-neutral text-neutral-content">
                <th className="w-12 border-r border-neutral-content/10">#</th>
                <th>Berufsfeld</th>
                <th className="text-center w-28">Kandidaten</th>
                <th className="text-right w-48">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredMajors.map((major, idx) => {
                const title =
                  major?.title ||
                  major?.collectionName ||
                  major?.slug ||
                  major?.name ||
                  String(major);
                const linkId =
                  major?.linkId ||
                  major?.uuid ||
                  major?.id ||
                  major?.collectionName ||
                  major;
                const count = resolveMajorCount(major, serverCounts);
                const colName = String(
                  major?.collectionName ||
                    major?.slug ||
                    major?.name ||
                    "",
                ).trim();
                const isCountLoading = Boolean(
                  colName && loadingCounts?.[colName],
                );
                const majorKey = resolveMajorKey(major);

                return (
                  <tr key={linkId} className="transition-colors hover:bg-primary/5">
                    <td className="text-base-content/40 border-r border-base-300/50">{idx + 1}</td>
                    <td>
                      <Link
                        to={`collectionCv/${linkId}`}
                        className="font-medium link link-hover link-primary"
                        title={title}
                      >
                        {title}
                      </Link>
                    </td>
                    <td className="text-center">
                      {isCountLoading ? (
                        <span className="loading loading-dots loading-xs" />
                      ) : (
                        <span className="badge badge-primary badge-sm">
                          {count ?? 0}
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleCopyLink(major)}
                          title="Link kopieren"
                        >
                          <FaRegCopy />
                        </button>
                        {!isLimitedAdmin && (
                          <>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() =>
                                setDeleteMajorModal({
                                  open: true,
                                  major,
                                  deleting: false,
                                })
                              }
                              title="Löschen"
                            >
                              <FaTrash />
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost btn-xs"
                              onClick={() =>
                                setSettingsMajor({ major, key: majorKey })
                              }
                              title="Einstellungen"
                            >
                              <FaCog />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Home;
