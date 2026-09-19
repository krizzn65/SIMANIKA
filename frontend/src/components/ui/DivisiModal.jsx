"use client";

import { useEffect, useRef } from "react";
import { PixelCorner } from "@/components/ui/PixelCorner";

export function DivisiModal({ division, structure, onClose, icons }) {
  const modalRef = useRef(null);
  const isOpen = Boolean(division && structure);

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
      <div
        ref={modalRef}
        className="divisi-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-division-title"
      >
        <PixelCorner position="top-right" />
        <PixelCorner position="bottom-left" />

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
            aria-label="Tutup bagan struktur"
          >
            <span className="divisi-modal__close-icon" aria-hidden="true">✕</span>
            <span className="divisi-modal__close-hint">ESC</span>
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
                  <div className="flowchart-node__tag">
                    <span className="flowchart-node__dot" />
                    {structure.leader.tag || "PIMPINAN UTAMA"}
                  </div>
                  <h4 className="flowchart-node__role">{structure.leader.role}</h4>
                  <p className="flowchart-node__title">{structure.leader.title}</p>
                </div>
              </div>

              {/* Vertical line from Ketua to Wakil */}
              <div className="flowchart-connector flowchart-connector--single">
                <span className="flowchart-connector__line" />
                <span className="flowchart-connector__arrow" />
              </div>

              {/* Level 2: WAKIL */}
              <div className="flowchart-level flowchart-level--vice">
                <div className="flowchart-node flowchart-node--vice">
                  <div className="flowchart-node__tag">
                    <span className="flowchart-node__dot flowchart-node__dot--cyan" />
                    {structure.vice.tag || "WAKIL PIMPINAN"}
                  </div>
                  <h4 className="flowchart-node__role">{structure.vice.role}</h4>
                  <p className="flowchart-node__title">{structure.vice.title}</p>
                </div>
              </div>

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
                          <span className="flowchart-node__sub-badge">
                            // 0{rIdx + 1}
                          </span>
                          <h5 className="flowchart-node__sub-role">{item.role}</h5>
                          <p className="flowchart-node__sub-title">{item.title}</p>
                          {item.desc && (
                            <p className="flowchart-node__sub-desc">{item.desc}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Division Focus & Programs Preview */}
          <div className="divisi-modal__footer-strip">
            <div className="divisi-modal__desc-box">
              <span className="divisi-modal__desc-label">// TUGAS UTAMA:</span>
              <p className="divisi-modal__desc-text">{division.description}</p>
            </div>
            <div className="divisi-modal__tags-wrap">
              <span className="divisi-modal__tags-label">// PROGRAM KERJA:</span>
              <div className="divisi-modal__tags">
                {division.programs.map((p) => (
                  <span className="divisi-modal__tag-chip" key={p}>
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
