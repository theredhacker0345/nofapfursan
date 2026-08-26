import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Join = () => {
  const [searchParams] = useSearchParams();
  const streak = searchParams.get("streak");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
      <h1 className="text-4xl font-display text-gradient-fire mb-4">You're Invited!</h1>
      {streak && (
        <p className="text-xl text-muted-foreground mb-8">
          Your friend has a {streak}-day streak. Can you beat it?
        </p>
      )}
      <p className="text-lg text-muted-foreground mb-8">
        Join the challenge to track your self-control, build discipline, and achieve your goals.
      </p>
      <Button asChild size="lg">
        <Link to="/">Accept the Challenge</Link>
      </Button>
    </div>
  );
};

export default Join;
