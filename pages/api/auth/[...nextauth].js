// ✅ /pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials;

        // ✅ ตัวอย่างระบบตรวจสอบ (mock)
        const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
        const found = storedUsers.find(
          (u) => u.email === email && u.password === password
        );

        if (found) {
          return { id: found.email, name: found.email };
        }

        return null;
      },
    }),
  ],

  // ✅ การตั้งค่า session
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  secret: "originx_super_secret_key",
}
                       );
