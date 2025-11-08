"use client"
import React, { useEffect, useState } from 'react'
import AudioCallModel from '@/components/contact/AudioCallModel';
import { useDialer } from '@/app/context/DialerContext';
import AddContact from '@/components/contact/AddContact';
import {customFetch} from '@/api/customFetch';
import EditContact from '@/components/contact/EditContact';
import { fetchContacts } from '@/services/contact';

const Contact = ({handleCall, setStartCall, startCall}) => {

    const {extensionData, contactData, setContactData} = useDialer();

    const [organizedContacts, setOrganizedContacts] = useState({});
    const [selectedContact, setSelectedContact] = useState({
        id: '',
        first_name: '',
        last_name: '',
        company: '',
        numbers: []
    });
    const [searchedContact, setSearchedContact] = useState(null);
    // const [newContactData, setNewContactData] = useState({});
    // const { contactData, setPhoneNumber, setActiveTap } = useDialer();

    useEffect(() => {
        // console.log("contactData", contactData);
        if(contactData !== null && contactData !== undefined && contactData !== '' && contactData.detail !== 'Not Found') {
            organiseContact(contactData);
           
        }
    }, [contactData]);

    const handleViewContact = (contact) => {
        setSelectedContact(contact);
        setOpenModal(true);
        // console.log("add contact");
    }

    const organiseContact = (contactsDetails) =>{
        const organized = contactsDetails.reduce((acc, contact) => {
            const firstLetter = contact.first_name.charAt(0).toUpperCase();
            if (!acc[firstLetter]) {
                acc[firstLetter] = [];
            }
            acc[firstLetter].push(contact);
            return acc;
        }, {});

        setOrganizedContacts(organized);
    }

    const fetchContactData = async () => {
        const extensionId = extensionData?.[0]?.id;
        if (extensionId) {
            const contactResponse = await fetchContacts(extensionId);
            if (contactResponse.success) {
                setContactData(contactResponse.data);
                organiseContact(contactResponse.data);
            }
        }
    };

    const handleContactAddedOrDeleted = () => {
        fetchContactData();
    };

    // const handleEditContact = ()=>{
        
    // }

    const handleSearch = (e)=>{
        console.log(e.target.value);
        setSearchedContact(e.target.value);
    }

    const filterLettersBySearch = (letter) => {
        if (!searchedContact) return true;
        const filteredContacts = organizedContacts[letter].filter(contact =>
            contact.first_name.toLowerCase().includes(searchedContact.toLowerCase()) ||
            contact.last_name.toLowerCase().includes(searchedContact.toLowerCase())
        );
        return filteredContacts.length > 0;
    }

    const [openModal, setOpenModal] = useState(false);
    const [openAddModal, setOpenAddModal] = useState(false);

    return (
        <div>
            <div className="p-4 pb-0">
                <div className="user-chat-nav float-end">
                    <div>
                        <button type="button"
                            className="btn btn-link text-decoration-none text-muted font-size-18 py-0"
                            onClick={() => setOpenAddModal(true)}
                            >
                            <i className="ri-user-add-line"></i>
                        </button>
                    </div>
                </div>
                <h4 className="mb-4">Contacts</h4>

                <AddContact onContactAdded={handleContactAddedOrDeleted} openModal={openAddModal} setOpenModal={setOpenAddModal} />

                <div className="search-box chat-search-box">
                    <div className="input-group bg-light  input-group-lg rounded-3">
                        <div className="input-group-prepend">
                            <button className="btn btn-link text-decoration-none text-muted pe-1 ps-3"
                                type="button">
                                <i className="ri-search-line search-icon font-size-18"></i>
                            </button>
                        </div>
                        <input type="text" className="form-control bg-light" placeholder="Search users.." onChange={handleSearch} />
                    </div>
                </div>
            </div>

            <div className="p-4 chat-message-list chat-group-list pt-0" data-simplebar>
                {Object.keys(organizedContacts)
                    .filter(filterLettersBySearch)
                    .sort()
                    .map((letter) => (
                    <div className="mt-3" key={letter}>
                        <div className="p-3 fw-bold text-primary">
                            {letter}
                        </div>
                        <ul className="list-unstyled contact-list">
                            {organizedContacts[letter]
                                .filter(contact => 
                                    !searchedContact || 
                                    contact.first_name.toLowerCase().includes(searchedContact.toLowerCase()) ||
                                    contact.last_name.toLowerCase().includes(searchedContact.toLowerCase())
                                )
                                .map((contact, index) => (
                                <li className="contact-item" key={index}>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <h5 className="font-size-14 m-0">{contact.first_name} {contact.last_name} </h5>
                                        </div>
                                        <div className="dropdown">
                                            <a href="#" 
                                               className="text-muted" 
                                                onClick={() => handleViewContact(contact)}>
                                                <i className="ri-phone-line color-blue"></i>
                                            </a>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {selectedContact && (
                <AudioCallModel 
                    contact={selectedContact}
                    setContact={setSelectedContact} 
                    onContactDeleted={handleContactAddedOrDeleted}
                    setStartCall={setStartCall}
                    startCall={startCall}
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                />
            )}

           

        </div>
    );
}

export default Contact