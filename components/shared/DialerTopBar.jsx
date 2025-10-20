import React from 'react'
import { useDialer } from '@/app/context/DialerContext';

const DialerTopBar = () => {

    const { extensionData, selectedExtension, setSelectedExtension, setTriggerCallHistory } = useDialer();
    const handleExtensionChange = (value) => {
        const ext = extensionData?.find(e => String(e.extension) === String(value));
        if (ext) {
            setSelectedExtension(ext);
            setTriggerCallHistory(true);
        }
    }

  return (
    <div className="p-4">
        <div className="d-flex mb-4 align-items-center">

            <div className="col col-dialler">
                <b>DID : {extensionData?.[0]?.did}</b>
            </div>
            <div className="col col-extension user-chat-nav d-flex justify-content-end">
                <div className="d-inline-flex align-items-baseline gap-2">
                    <i className="ri-record-circle-fill font-size-10 text-success d-inline-block"></i>
                    <span className="fw-bold align-baseline">Ext:</span>
                    <select className="form-select form-select-sm w-auto d-inline-block align-baseline" value={selectedExtension?.extension || ''} onChange={(e) => handleExtensionChange(e.target.value)}>
                        {extensionData?.map((extension) => (
                            <option value={extension.extension} key={extension.id}>{extension.extension}</option>
                        ))}
                    </select>
                </div>
            </div>

        </div>

        <div className="search-box chat-search-box">

        </div>
    </div>
  )
}

export default DialerTopBar