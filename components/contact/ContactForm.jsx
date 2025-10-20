"use client"
import React from 'react'
import ContactNumber from '@/components/contact/ContactNumber';


const ContactForm = ({handleSubmit, handleNewNumber, handleNumberChange, numbers, register, errors, onSubmit, isEditing = false, handleClose}) => {

    
     // Handle form submission
    
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
            <label htmlFor="first_name" className="form-label">First Name</label>
            <input type="text" className="form-control" id="first_name"
                placeholder="Enter First Name" {...register("first_name")} />
            {errors.first_name && <p className="text-danger">{errors.first_name.message}</p>}
        </div>
        <div className="mb-3">
            <label htmlFor="last_name" className="form-label">Last Name</label>
            <input type="text" className="form-control" id="last_name"
                placeholder="Enter Last Name" {...register("last_name")} />
            {errors.last_name && <p className="text-danger">{errors.last_name.message}</p>}
        </div>
        <div className="mb-3">
            <label htmlFor="company" className="form-label">Company</label>
            <input type="text" className="form-control" id="company"
                placeholder="Enter Company" {...register("company")} />
        </div>
        <div className="mb-3">
            <label htmlFor="notes" className="form-label">Notes</label>
            <textarea className="form-control" id="notes"
                rows="3" placeholder="Enter Notes" {...register("notes")}></textarea>
        </div>
        <div className="mb-3">
            <label className="form-label">Contact Numbers</label>
            <button className="btn" onClick={handleNewNumber} type="button">+</button>

            {numbers.map((number, index) => (
                <ContactNumber 
                    key={index}
                    number={number} 
                    index={index} 
                    register={register} 
                    handleNumberChange={handleNumberChange} 
                    errors={errors}
                />
            ))}
        </div>
        <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input type="text" className="form-control" id="email"
                placeholder="Enter Email" {...register("email")} />
            {errors.email && <p className="text-danger">{errors.email.message}</p>}
        </div>
        <div className="modal-footer">
            <button type="button" className="btn btn-link" data-bs-dismiss="modal" onClick={handleClose}>Close</button>
            <button type="submit" className="btn btn-primary"> {isEditing? 'Edit Contact' : 'Add Contact' } </button> 
            
        </div>
    </form>
  )
}

export default ContactForm