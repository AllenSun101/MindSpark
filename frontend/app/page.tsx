'use client'

import Image from "next/image";
import axios from "axios";
import { useState } from "react";

export default function Home() {
  const [response, setResponse] = useState("");

  axios.get('http://localhost:3001/')
  .then((response) => {
    // Handle the response data
    console.log(response.data);
    setResponse(response.data);
  })
  .catch((error) => {
    // Handle errors
    console.error('Error fetching data:', error);
  });

  return (
    <div className="">
      <p>{response}</p>
    </div>
  );
}
