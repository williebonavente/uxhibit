import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
export default async function Dashboard() {

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col space-y-5">
      <div className="site-header">
        <div>
          <p className="text-white">Welcome back, <span className="font-semibold">
              {/*TODO: Replace the hard coded with the authenticated user  */}
              Vanness
            </span>!
          </p>
          <p className="text-4xl text-white">
            It&apos;s Time to
            <span className="xhibit-gradient-text"> Xhibit</span> Greatness.
          </p>
        </div>


        <div className="user-card">
          <div>
            <Avatar className="h-14 w-14 rounded-lg">
              <AvatarFallback className="rounded-lg">
                {/* TODO: Replace the hard coded with the authenticated user credentials  */}
                VL

              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-semibold">
              {/* TODO: Replace the hard coded name with authenticated user  */}
              Vanness Lao
            </p>
            <p className="text-sm">UI/UX Designer</p>
          </div>
        </div>
      </div>
      <div className="border-b-2 p-2">
        <h1 className="text-xl font-medium">My Works</h1>
        {/* Add new component to display the uploaded UI/UX design */}
      </div>
    </div>
  );
}
