import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Dashboard() {
  return (
    <div className="flex flex-col space-y-5">
      <div className="p-8 h-48 w-full rounded-xl bg-[linear-gradient(to_right,_#19181D,_#B22A13,_#ED5E20,_#FFA600)] flex flex-row items-center justify-between">
        <div>
          <p className="text-white">
            {" "}
            Welcome back, <span className="font-semibold">Vanness</span>!
          </p>
          <p className="text-4xl text-white">
            It's Time to{" "}
            <span className="bg-[linear-gradient(to_right,_#FF4D00,_#ED5E20,_#FFA600,_#FFDB97)] bg-clip-text text-transparent font-semibold">
              Xhibit
            </span>{" "}
            Greatness.
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg text-black flex flex-row items-center justify-between space-x-2">
          <div>
            <Avatar className="h-14 w-14 rounded-lg">
              <AvatarFallback className="rounded-lg">VL</AvatarFallback>
            </Avatar>
          </div>
          <div>
            <p className="font-semibold">Vanness Lao</p>
            <p className="text-sm">UI/UX Designer</p>
          </div>
        </div>
      </div>
      <div className="border-b-2 p-2">
        <h1 className="text-xl font-medium">My Works</h1>
      </div>
    </div>
  );
}
