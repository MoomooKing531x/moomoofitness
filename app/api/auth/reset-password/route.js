import { prisma, bcrypt } from "../../../../lib/db.js";
import { getUserIdFromCookies } from "../../../../lib/auth.js";

export async function POST(request) {
  const userId = getUserIdFromCookies();
  if (!userId) return Response.json({ error: "Not logged in." }, { status: 401 });

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return Response.json({ error: "Current and new password required." }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return Response.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return Response.json({ error: "User not found." }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return Response.json({ ok: true });
}

