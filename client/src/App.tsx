import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Instructions from "@/pages/Instructions";
import TestInterface from "@/pages/TestInterface";
import Result from "@/pages/Result";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/instructions/:examId" component={Instructions} />
      <Route path="/test/:attemptId" component={TestInterface} />
      <Route path="/result/:attemptId" component={Result} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
