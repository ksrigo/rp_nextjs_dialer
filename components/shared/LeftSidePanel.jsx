import Image from 'next/image'
import React from 'react'

const LeftSidePanel = () => {
  return (
    <div className="col-12 pb-2">
        <Image src="/assets/images/cloud_Ring.webp" alt="Cloud Ring" className="login-logo" width={120} height={74} />
    </div>
  )
}

export default LeftSidePanel