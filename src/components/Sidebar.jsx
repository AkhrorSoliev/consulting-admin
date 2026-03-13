/**
 * Sidebar - slide-in panel showing Berufsfelder (Majors) list.
 * Used on all pages except Home.
 */

import { forwardRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { IoMdAddCircle } from "react-icons/io";
import { FaRegCopy, FaTrash, FaCog } from "react-icons/fa";
import MajorModal from "./MajorModal";
import LinkCopyModal from "./LinkCopyModal";
import MajorSettingsModal from "./MajorSettingsModal";
import { buildCreateLink } from "./majorsHelpers";
import {
  DeleteMajorModal,
  useMajorsData,
  resolveMajorCount,
  resolveMajorKey,
} from "./majorsList/index";

const Sidebar = forwardRef(function Sidebar({ isOpen = false, onClose }, ref) {
  const location = useLocation();
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
    <>
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

      <aside
        ref={ref}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose?.();
        }}
        className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-[26rem] max-w-[80vw] transform bg-base-300/95 shadow-xl transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Berufsfelder</h3>
            <span className="badge badge-ghost badge-sm">
              {filteredMajors.length}
            </span>
          </div>
          {!isLimitedAdmin && (
            <button
              onClick={addMajor}
              className="btn btn-outline btn-primary btn-block"
            >
              <IoMdAddCircle className="mr-2 text-xl" /> Neues Berufsfeld
            </button>
          )}
        </div>

        {/* Majors list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {filteredMajors.length === 0 ? (
            <div className="text-center opacity-70 py-8 text-sm">
              <p>Keine Berufsfelder vorhanden.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {filteredMajors.map((major) => {
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
                const isActive =
                  location.pathname === `/collectionCv/${linkId}`;

                return (
                  <li
                    key={linkId}
                    className={`flex items-center gap-2 rounded-lg border border-base-200 p-2 transition-colors ${
                      isActive
                        ? "bg-primary/10 border-primary/30"
                        : "hover:bg-base-200/50"
                    }`}
                  >
                    <div className="indicator grow min-w-0">
                      <span
                        className="indicator-item indicator-top indicator-end badge badge-sm badge-primary pointer-events-none select-none -translate-x-[20%]"
                      >
                        {isCountLoading ? "\u2026" : (count ?? 0)}
                      </span>
                      <Link
                        to={`/collectionCv/${linkId}`}
                        className="btn btn-sm btn-outline-info justify-start overflow-hidden min-w-0 w-full pr-12"
                        title={title}
                        onClick={() => onClose?.()}
                      >
                        <span className="font-medium truncate">{title}</span>
                      </Link>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleCopyLink(major)}
                      title="Link kopieren"
                    >
                      <FaRegCopy />
                    </button>
                    {!isLimitedAdmin && (
                      <>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline btn-error"
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
                          className="btn btn-sm btn-outline"
                          onClick={() =>
                            setSettingsMajor({ major, key: majorKey })
                          }
                          title="Einstellungen"
                        >
                          <FaCog />
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
});

export default Sidebar;
