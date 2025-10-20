"use client";
import React from "react";

const ContactNumber = ({ handleNumberChange, register, index, errors }) => {
    return (
        <>
            <div className="contact-row mb-2">
                <select
                    className="form-control"
                    {...register(`numbers.${index}.type`)}
                    onChange={(e) => handleNumberChange(index, "type", e.target.value)}
                >
                    <option value="mobile">Mobile</option>
                    <option value="home">Home</option>
                </select>
                <input
                    type="text"
                    className="form-control"
                    {...register(`numbers.${index}.number`)}
                    placeholder="Enter Number"
                    onChange={(e) => handleNumberChange(index, "number", e.target.value)}
                />
            </div>
            {errors?.numbers?.[index]?.number && (
                <p className="text-danger">{errors.numbers[index].number?.message}</p>
            )}
        </>
    );
};

export default ContactNumber;
