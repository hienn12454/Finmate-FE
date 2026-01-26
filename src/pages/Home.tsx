import { useEffect } from "react";
import { accountTypeApi } from "../api/accountType.api";

export default function Home() {
  useEffect(() => {
    accountTypeApi
      .getAll()
      .then((res) => {
        console.log("Account Types:", res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  return <h1>🏠 Home Page</h1>;
}
