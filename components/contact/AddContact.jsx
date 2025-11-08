"use client";
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ContactForm from "@/components/contact/ContactForm";
import { useDialer } from "@/app/context/DialerContext";
import { customFetch } from "@/api/customFetch";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { addContact, fetchContacts } from "@/services/contact";

const schema = z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    company: z.string().optional(),
    notes: z.string().optional(),
    numbers: z.array(
        z.object({
            type: z.string().min(1, "Type is required"),
            number: z.string().min(1, "Number is required"),
        })
    )
    .min(1, "At least one contact number is required")
    .refine((data) => data.every((item) => item.type && item.number), {
        message: "Each contact number must have both a type and a number",
    }),
    email: z.string().email("Invalid email format").min(5, "Email must be at least 5 characters"),
});

const AddContact = ({ onContactAdded, openModal, setOpenModal }) => {
    const { extensionData, setContactData } = useDialer();
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            first_name: "",
            last_name: "",
            company: "",
            notes: "",
            numbers: [{ type: "mobile", number: "" }],
            email: ""
        }
    });

    const numbers = watch("numbers");

    const handleNewNumber = (e) => {
        e.preventDefault();
        setValue("numbers", [...numbers, { type: "mobile", number: "" }]);
    };

    const handleNumberChange = (index, field, value) => {
        const updatedNumbers = [...numbers];
        updatedNumbers[index][field] = value;
        setValue("numbers", updatedNumbers);
    };

    const onSubmit = async (data) => {
        const extensionId = extensionData?.[0]?.id;
        if (extensionId != null) {
            const response = await addContact(extensionId, data);
            if (!response.success && response.message != "success") {
                toast.error(response.message);
            } else {
                toast.success(response.message);
                const contactResponse = await fetchContacts(extensionId);
                if (contactResponse.success) {
                    setContactData(contactResponse.data);
                }
                reset({
                    first_name: "",
                    last_name: "",
                    company: "",
                    notes: "",
                    numbers: [{ type: "mobile", number: "" }],
                    email: ""   
                });
                onContactAdded();
                setOpenModal(false);
            }
        }
    };

    return (
        <Modal id="addContactModal" title="Add Contact" onClose={() => {reset(); setOpenModal(false);}} isOpen={openModal} >
            <ContactForm handleSubmit={handleSubmit} handleNewNumber={handleNewNumber} handleNumberChange={handleNumberChange} numbers={numbers} register={register} errors={errors} onSubmit={onSubmit} />
        </Modal>
    );
};

export default AddContact;
