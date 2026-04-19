"use client"
import React, { useEffect } from 'react';

const Seo = ({ title }) => {

    useEffect(() => {
        document.title = `Team#16 - ${title}`
      }, [])

  return (
    <>
    </>
  )
}

export default Seo
