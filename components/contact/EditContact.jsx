"use client";
import React, { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ContactForm from "@/components/contact/ContactForm";
import {customFetch} from '@/api/customFetch';
import toast from "react-hot-toast";
import { editContact } from '@/services/contact';

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


const EditContact = ({onContactEdited, contact, isEditing, modalRef, setIsEditing, setContact }) => {


    // useEffect(() => {
    //     if (modalRef.current) {
    //         modalRef.current = new Modal(document.getElementById("audiocallModal"));
    //     }
    // }, []);
    // useEffect(() => {
    //     if (typeof window !== "undefined") {
    //         import("bootstrap").then(({ Modal }) => {
    //             const modalElement = document.getElementById("audiocallModal");
    //             if (modalElement) {
    //                 modalRef.current = new Modal(modalElement);
    //                 modalElement.addEventListener("hidden.bs.modal", () => setIsEditing(false));
    //             }
    //         });
    //     }
    // }, []);

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            id:contact.id || 0,
            first_name: contact.first_name || "",
            last_name: contact.last_name || "",
            company: contact.company || "",
            notes: contact.notes || "",
            numbers: contact.numbers || [],
            email: contact.email || ""
        }
    });

    useEffect(() => {
        // Reset the form whenever the contact data changes
        reset({
            id: contact.id || 0,
            first_name: contact.first_name || "",
            last_name: contact.last_name || "",
            company: contact.company || "",
            notes: contact.notes || "",
            numbers: contact.numbers || [],
            email: contact.email || ""
        });
    }, [contact, reset]);

    // useEffect(() => {
    //     setValue("numbers", [{ type: "mobile", number: "" }]);
    // }, [setValue]);

    // Watch numbers array from the form
    const numbers = watch("numbers");

    // Function to add a new number field
    const handleNewNumber = (e) => {
        e.preventDefault();
        setValue("numbers", [...numbers, { type: "mobile", number: "" }]);
    };

    // Function to update number fields
    const handleNumberChange = (index, field, value) => {
        const updatedNumbers = [...numbers];
        updatedNumbers[index][field] = value;
        setValue("numbers", updatedNumbers);
    };

    const onSubmit = async (data) => {
            // console.log("Submitted data:", data);
            // console.log("errors",errors)
            // console.log("contactId", contact.id)
        // alert("Form submitted successfully!");
        if(contact.id != null)
        {
            const response = await editContact(contact.id, data);
            // console.log("response.......", response);
            if(!response.success) {
                toast.error(response.message);
            }
            else {
                toast.success(response.message);
                setContact({
                    id:data.id,
                    first_name:data.first_name,
                    last_name: data.last_name,
                    company: data.company,
                    notes: data.notes,
                    numbers: data.numbers,
                    email: data.email

                })
                // reset({
                //     id:"",
                //     first_name: "",
                //     last_name: "",
                //     company: "",
                //     notes: "",
                //     numbers: [{ type: "mobile", number: "" }],
                //     email: ""
                // });
                // modalRef.current.hide();
                // if (modalRef.current) {
                //     modalRef.current.hide(); 
                // }
                onContactEdited();
                reset(); 

            }
        }

        setIsEditing(false);

    };

    const handleClose = () =>{
        setIsEditing(false);
    }

    return (
       <>
        {/* <div className="modal-header">
            <h5 className="modal-title font-size-16" id="addContactModalLabel">
                Edit Contact
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div> */}
        <div className="modal-body p-4">
            <ContactForm handleSubmit={handleSubmit} handleNewNumber={handleNewNumber} handleNumberChange={handleNumberChange} numbers={numbers} register={register} errors={errors}  onSubmit={onSubmit} isEditing={isEditing} handleClose={handleClose} />
        </div>
       </>
    );
};

export default EditContact;
