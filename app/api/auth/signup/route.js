import { prisma, bcrypt } from "../../../../lib/db.js";
import { setSessionCookie } from "../../../../lib/auth.js";

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password || username.length < 3 || username.length > 30 || password.length < 6) {
    return Response.json(
      { error: "Username must be 3-30 chars and password 6+ chars." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return Response.json({ error: "Username already taken." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, passwordHash },
  });

  setSessionCookie(user.id);

  return Response.json({ id: user.id, username: user.username });
}

