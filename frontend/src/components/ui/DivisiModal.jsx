"use client";

import { useEffect, useRef, useState } from "react";
import { TechCornerBracket } from "@/components/ui/TechCornerBracket";
import { CloseSmallIcon } from "@/components/ui/CloseSmallIcon";

export function DivisiModal({ division, structure, onClose, icons }) {
  const modalRef = useRef(null);
  const isOpen = Boolean(division && structure);
  const [closeHoverKey, setCloseHoverKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Lock body scroll only while modal is actually open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="divisi-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div className="divisi-modal-frame">
        <TechCornerBracket
          position="top-right"
          className="divisi-modal__frame-corner divisi-modal__frame-corner--tr"
        />
        <TechCornerBracket
          position="bottom-left"
          className="divisi-modal__frame-corner divisi-modal__frame-corner--bl"
        />

        <div
          ref={modalRef}
          className="divisi-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-division-title"
        >

        {/* Modal Topbar */}
        <div className="divisi-modal__header">
          <div className="divisi-modal__title-group">
            <div className="divisi-modal__icon-wrap">
              {division.logo ? (
                <img
                  src={division.logo}
                  alt={`Logo ${division.name}`}
                  className="divisi-modal__logo"
                  width={40}
                  height={40}
                />
              ) : (
                icons && icons[division.icon] ? (
                  <span className="divisi-modal__icon-fallback">
                    {icons[division.icon]}
                  </span>
                ) : null
              )}
            </div>
            <div>
              <div className="divisi-modal__eyebrow">
                // {division.index} · STRUKTUR ORGANISASI
              </div>
              <h3 id="modal-division-title" className="divisi-modal__title">
                {division.name} <span className="divisi-modal__full">({division.full})</span>
              </h3>
            </div>
          </div>

          <button
            type="button"
            className="divisi-modal__close-btn"
            onClick={onClose}
            onMouseEnter={() => setCloseHoverKey((k) => k + 1)}
            aria-label="Tutup bagan struktur"
          >
            <CloseSmallIcon size={20} key={closeHoverKey} />
          </button>
        </div>

        {/* Modal Body: Flowchart Diagram */}
        <div className="divisi-modal__body">
          <div className="flowchart-board">
            <div className="flowchart-board__grid" />

            <div className="flowchart-tree">
              {/* Level 1: KETUA */}
              <div className="flowchart-level flowchart-level--leader">
                <div className="flowchart-node flowchart-node--leader">
                  <h4 className="flowchart-node__role">{structure.leader.role}</h4>
                  <p className="flowchart-node__title">{structure.leader.title}</p>
                </div>
              </div>

              {/* Level 2: WAKIL */}
              {structure.vice && (
                <>
                  <div className="flowchart-connector flowchart-connector--single">
                    <span className="flowchart-connector__line" />
                    <span className="flowchart-connector__arrow" />
                  </div>

                  <div className="flowchart-level flowchart-level--vice">
                    <div className="flowchart-node flowchart-node--vice">
                      <h4 className="flowchart-node__role">{structure.vice.role}</h4>
                      <p className="flowchart-node__title">{structure.vice.title}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Level 2.5: SEKRETARIS (jika ada seperti di divisi Humas) */}
              {structure.secretary && (
                <>
                  <div className="flowchart-connector flowchart-connector--single">
                    <span className="flowchart-connector__line" />
                    <span className="flowchart-connector__arrow" />
                  </div>

                  <div className="flowchart-level flowchart-level--secretary">
                    <div className="flowchart-node flowchart-node--vice">
                      <h4 className="flowchart-node__role">{structure.secretary.role}</h4>
                      <p className="flowchart-node__title">{structure.secretary.title}</p>
                    </div>
                  </div>
                </>
              )}

              {/* Branch Connector from Wakil splitting to two parallel groups */}
              <div className="flowchart-fork-connector">
                <div className="flowchart-fork__stem" />
                <div className="flowchart-fork__bar" />
                <div className="flowchart-fork__drops">
                  <div className="flowchart-fork__drop">
                    <span className="flowchart-connector__arrow" />
                  </div>
                  <div className="flowchart-fork__drop">
                    <span className="flowchart-connector__arrow" />
                  </div>
                </div>
              </div>

              {/* Level 3: PARALLEL BRANCHES (Sekretariat & Kebendaharaan sejajar) */}
              <div className="flowchart-branches">
                {structure.branches.map((branch, bIdx) => (
                  <div className="flowchart-branch" key={branch.branchName || bIdx}>
                    <div className="flowchart-branch__header">
                      <span className="flowchart-branch__pill">{branch.branchName}</span>
                    </div>

                    <div className="flowchart-branch__items">
                      {branch.roles.map((item, rIdx) => (
                        <div
                          className="flowchart-node flowchart-node--sub"
                          key={item.role || rIdx}
                        >
                          <h5 className="flowchart-node__sub-role">{item.role}</h5>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Division Focus Preview */}
          <div className="divisi-modal__footer-strip">
            <div className="divisi-modal__desc-box">
              <span className="divisi-modal__desc-label">// TUGAS UTAMA:</span>
              <p className="divisi-modal__desc-text">{division.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
