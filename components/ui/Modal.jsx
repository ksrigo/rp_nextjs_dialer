"use client";
import React, { useRef } from "react";

const Modal = ({ id, title, children, isOpen = false, onClose }) => {
    const modalRef = useRef(null);

    const handleBackdropClick = (event) => {
        if (modalRef.current && modalRef.current === event.target) {
            onClose();
        }
    };

    return (
        <div
            className={`modal ${isOpen ? 'show' : ''}`}
            id={id}
            aria-hidden={!isOpen}
            onClick={handleBackdropClick}
            ref={modalRef}
            style={{ display: isOpen ? 'block' : 'none' }} 
        >
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title}</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close">&times;</button>
                    </div>
                    <div className="modal-body">{children}</div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
