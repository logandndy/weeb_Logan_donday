import { useEffect, useId, useRef } from 'react';
import '../styles/ConfirmDialog.css';

/**
 * Fenêtre de confirmation avant une action importante (déconnexion, suppression).
 *
 * Elle s'appuie sur la balise <dialog> du navigateur : focus piégé dans la
 * fenêtre, fond assombri et touche Échap gérés nativement. Le focus part sur
 * « Annuler » pour qu'un appui sur Entrée ne valide pas l'action par erreur.
 */
const ConfirmDialog = ({ open, title, message, confirmLabel, danger = false, onConfirm, onCancel }) => {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      // jsdom (tests) ne connaît pas showModal : on ouvre alors simplement la balise.
      if (dialog.showModal) dialog.showModal();
      else dialog.setAttribute('open', '');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby={titleId}
      // Échap : on ferme via le parent pour garder son état à jour.
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      // Un clic sur le fond (hors de la boîte) annule aussi.
      onClick={(event) => {
        if (event.target === dialogRef.current) onCancel();
      }}
    >
      <div className="confirm-dialog__box">
        <h2 id={titleId} className="confirm-dialog__title">
          {title}
        </h2>
        {message && <p className="confirm-dialog__message">{message}</p>}
        <div className="confirm-dialog__actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel} autoFocus>
            Annuler
          </button>
          <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;
