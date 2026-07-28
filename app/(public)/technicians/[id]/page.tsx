import { redirect } from "next/navigation"

type Params = Promise<{ id: string }>

export default async function TechnicianIdRedirect({
  params,
}: {
  params: Params
}) {
  const { id } = await params
  redirect(`/technician?id=${encodeURIComponent(id)}`)
}
