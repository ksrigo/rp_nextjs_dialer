import Image from 'next/image'
import React from 'react'

const QRLogin = () => {
  return (
    <div className="p-2 text-center">
        <Image src="/assets/images/qr/qr.png" alt="QR code" className="img-fluid mb-2" width={100} height={100}/>
        <h4>Login with QR code</h4>
        <p><b>Scan this with yay.com mobile app to login instantly</b></p>
        <p><b>Go to Settings &gt; Scan Desktop QR code</b></p>
    </div>
  )
}

export default QRLogin