"use client"
import { useDialer } from '@/app/context/DialerContext';
import React, { useState, useEffect } from 'react';
import { customFetch } from '@/api/customFetch';
import toast from 'react-hot-toast';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';  
import { deleteContact } from '@/services/contact';
import EditContact from '@/components/contact/EditContact';
import Modal from '@/components/ui/Modal';
import { capitaliseCase } from '@/utils/helper';

const AudioCallModel = ({ contact, setContact, onContactDeleted, setStartCall, startCall, openModal, setOpenModal }) => {
    const [isEditing, setIsEditing] = useState(false);
    const { setPhoneNumber, setActiveTap } = useDialer();

    const handleDeleteConfirmation = () => {
        confirmAlert({
            title: 'Confirm to Delete',
            message: 'Are you sure you want to delete this contact?',
            overlayClassName: 'custom-overlay',
            messageClassName: 'custom-message',
            buttons: [
                {
                    label: 'Yes',
                    onClick: handleDeleteContact,
                },
                {
                    label: 'No',
                    onClick: () => console.log('Delete Cancelled'),
                },
            ],
        });
    };

    const handleDeleteContact = async () => {
        const response = await deleteContact(contact.id);
        if (!response.success) {
            toast.error(response.message);
        } else {
            toast.success(response.message);
            onContactDeleted();
        }
        setOpenModal(false);
    };

    // const capitaliseCase = (text) => {
    //     return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    // };

    const handleEditContact = () => {
        setIsEditing(true);
    };

    useEffect(() => {
        // console.log(openModal);
        if (!openModal) {
            setIsEditing(false);
        }
    }, [openModal]);

    return (
        <Modal id="audiocallModal22" title={isEditing ? "Edit Contact" : "Audio Call"} isOpen={openModal} onClose={() => setOpenModal(false)}>
            {!isEditing  ? (
                <>
                    <div className="contact-modal-header">
                        <button
                            type="button"
                            className="btn btn-soft-success btn-sm rounded-circle"
                            onClick={handleEditContact}
                        >
                            <i className="ri-pencil-fill"></i>
                        </button>
                        <button
                            type="button"
                            className="btn btn-soft-success text-danger btn-sm rounded-circle"
                            onClick={handleDeleteConfirmation}
                        >
                            <i className="ri-delete-bin-line"></i>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="text-center p-4">
                            <div className="avatar-lg mx-auto mb-4">
                                <img
                                    src="assets/images/users/avatar-4.jpg"
                                    alt=""
                                    className="img-thumbnail rounded-circle"
                                />
                            </div>
                            <h5 className="text-truncate">{contact.first_name} {contact.last_name}</h5>
                            <p className="text-muted">{contact.company}</p>
                            <div className="text-muted">
                                {contact.numbers.map((number, index) => (
                                    <div
                                        key={index}
                                        className="d-flex align-items-center justify-content-between px-4 py-2 mb-2 border rounded hover-shadow"
                                    >
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="phone-type-badge">
                                                <i className="ri-phone-line text-primary"></i>
                                                <span className="ms-1 text-primary fw-medium">{capitaliseCase(number.type)}</span>
                                            </div>
                                            <a
                                                href="#"
                                                className="text-dark text-decoration-none fw-medium"
                                            >
                                                {number.number}
                                            </a>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-soft-success btn-sm rounded-circle"
                                            onClick={() => {
                                                setPhoneNumber(number.number);
                                                setOpenModal(false)
                                                setActiveTap(1);
                                                setStartCall(true);
                                            }}
                                        >
                                            <i className="ri-phone-fill"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <EditContact key={contact.id} contact={contact} isEditing={isEditing} setIsEditing={setIsEditing} onContactEdited={onContactDeleted} setContact={setContact} />
            )}
        </Modal>
    );
};

export default AudioCallModel;
