import { cookies } from "next/headers";

export async function getServerToken(){
    try{
        const cookieStore = await cookies();
        return cookieStore.get('token')?.value || null;
    }catch(err){
        console.error(err);
        return null;
    }
}