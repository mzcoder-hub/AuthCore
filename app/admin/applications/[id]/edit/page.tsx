"use client";

import type React from "react";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/lib/api";

// Define types based on your API response
type Application = {
  id: string;
  name: string;
  type: "Web" | "Mobile" | "SPA" | "Service";
  clientId: string;
  clientSecret?: string;
  redirectUris: string[];
  status: "Active" | "Inactive" | "Development";
  createdAt: string;
  description?: string;
  accessTokenLifetime?: number; // in minutes
  refreshTokenLifetime?: number; // in days
  grantTypes?: string[];
  tokenSigningAlgorithm?: string;
  corsOrigins?: string[];
};

export default function EditApplicationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const applicationId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [applicationType, setApplicationType] = useState<
    "Web" | "SPA" | "Mobile" | "Service"
  >("Web");
  const [redirectUris, setRedirectUris] = useState<string[]>([""]);
  const [accessTokenLifetime, setAccessTokenLifetime] = useState<number>(60);
  const [accessTokenLifetimeUnit, setAccessTokenLifetimeUnit] =
    useState<string>("minutes");
  const [refreshTokenLifetime, setRefreshTokenLifetime] = useState<number>(30);
  const [refreshTokenLifetimeUnit, setRefreshTokenLifetimeUnit] =
    useState<string>("days");
  const [grantTypes, setGrantTypes] = useState<string[]>([]);
  const [tokenSigningAlgorithm, setTokenSigningAlgorithm] =
    useState<string>("RS256");
  const [corsOrigins, setCorsOrigins] = useState<string>("");
  const [status, setStatus] = useState<"Active" | "Inactive" | "Development">(
    "Active"
  );

  const fetchApplicationDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: Application = await fetchWithAuth(
        `applications/${applicationId}`
      ); // Updated call
      setApplication(data);

      // Set form states from fetched data
      setName(data.name);
      setDescription(data.description || "");
      setApplicationType(data.type);
      setRedirectUris(data.redirectUris.length > 0 ? data.redirectUris : [""]); // Ensure at least one empty input
      setAccessTokenLifetime(data.accessTokenLifetime || 60);
      // Assuming default unit is minutes for access token
      setAccessTokenLifetimeUnit("minutes");
      setRefreshTokenLifetime(data.refreshTokenLifetime || 30);
      // Assuming default unit is days for refresh token
      setRefreshTokenLifetimeUnit("days");
      setGrantTypes(data.grantTypes || []);
      setTokenSigningAlgorithm(data.tokenSigningAlgorithm || "RS256");
      setCorsOrigins(data.corsOrigins?.join(", ") || "");
      setStatus(data.status);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch application details"
      );
      toast({
        title: "Error",
        description:
          err instanceof Error
            ? err.message
            : "Failed to load application details.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, toast]);

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetails();
    }
  }, [applicationId, fetchApplicationDetails]);

  const addRedirectUri = () => {
    setRedirectUris([...redirectUris, ""]);
  };

  const updateRedirectUri = (index: number, value: string) => {
    const newUris = [...redirectUris];
    newUris[index] = value;
    setRedirectUris(newUris);
  };

  const removeRedirectUri = (index: number) => {
    const newUris = [...redirectUris];
    newUris.splice(index, 1);
    setRedirectUris(newUris);
  };

  const handleGrantTypeChange = (type: string, checked: boolean) => {
    setGrantTypes((prev) =>
      checked ? [...prev, type] : prev.filter((t) => t !== type)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Convert lifetimes to minutes/days
      const finalAccessTokenLifetime =
        accessTokenLifetimeUnit === "minutes"
          ? accessTokenLifetime
          : accessTokenLifetimeUnit === "hours"
          ? accessTokenLifetime * 60
          : accessTokenLifetimeUnit === "days"
          ? accessTokenLifetime * 60 * 24
          : accessTokenLifetime;

      const finalRefreshTokenLifetime =
        refreshTokenLifetimeUnit === "minutes"
          ? refreshTokenLifetime
          : refreshTokenLifetimeUnit === "hours"
          ? refreshTokenLifetime * 60
          : refreshTokenLifetimeUnit === "days"
          ? refreshTokenLifetime
          : refreshTokenLifetime;

      const payload = {
        name,
        description: description || null,
        type: applicationType,
        redirectUris: redirectUris.filter(Boolean),
        accessTokenLifetime: finalAccessTokenLifetime,
        refreshTokenLifetime: finalRefreshTokenLifetime,
        grantTypes,
        tokenSigningAlgorithm,
        corsOrigins: corsOrigins
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        status,
      };

      await fetchWithAuth(`applications/${applicationId}`, "PATCH", payload); // Updated call

      toast({
        title: "Success",
        description: "Application updated successfully!",
      });
      router.push(`/admin/applications/${applicationId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update application"
      );
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update application.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !application) {
    return (
      <div className='flex h-full w-full items-center justify-center p-8'>
        <div className='flex flex-col items-center gap-2'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='text-sm text-muted-foreground'>
            Loading application details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center gap-2'>
        <Button variant='ghost' size='icon' onClick={() => router.back()}>
          <ArrowLeft className='h-4 w-4' />
        </Button>
        <h1 className='text-3xl font-bold tracking-tight'>
          Edit {application.name}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
            <CardDescription>
              Update basic information about the application
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {error && (
              <div className='rounded-md bg-destructive/15 p-3 text-sm text-destructive'>
                {error}
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='name'>Application Name</Label>
              <Input
                id='name'
                placeholder='My Application'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className='text-sm text-muted-foreground'>
                A descriptive name for your application. This will be shown to
                users during authentication.
              </p>
            </div>

            <div className='space-y-2'>
              <Label>Application Type</Label>
              <RadioGroup
                value={applicationType}
                className='grid grid-cols-2 gap-4'
                onValueChange={(value: "Web" | "SPA" | "Mobile" | "Service") =>
                  setApplicationType(value)
                }
              >
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='Web' id='web' />
                  <Label htmlFor='web' className='font-normal'>
                    Web Application
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='SPA' id='spa' />
                  <Label htmlFor='spa' className='font-normal'>
                    Single Page App
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='Mobile' id='mobile' />
                  <Label htmlFor='mobile' className='font-normal'>
                    Mobile/Native App
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <RadioGroupItem value='Service' id='service' />
                  <Label htmlFor='service' className='font-normal'>
                    Service/API
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className='space-y-2'>
              <Label>Redirect URIs</Label>
              <div className='space-y-2'>
                {redirectUris.map((uri, index) => (
                  <div key={index} className='flex gap-2'>
                    <Input
                      value={uri}
                      onChange={(e) => updateRedirectUri(index, e.target.value)}
                      placeholder={
                        applicationType === "Web" || applicationType === "SPA"
                          ? "https://example.com/callback"
                          : applicationType === "Mobile"
                          ? "com.example.app://callback"
                          : ""
                      }
                      disabled={applicationType === "Service"}
                    />
                    {redirectUris.length > 1 && (
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        onClick={() => removeRedirectUri(index)}
                      >
                        <Trash className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {applicationType !== "Service" && (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addRedirectUri}
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Redirect URI
                </Button>
              )}
              <p className='text-sm text-muted-foreground'>
                {applicationType === "Service"
                  ? "Service applications don't require redirect URIs."
                  : "URIs where users will be redirected after authentication. Must exactly match the redirect URI used in your application."}
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                placeholder='Describe your application...'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status'>Status</Label>
              <Select
                value={status}
                onValueChange={(value: "Active" | "Inactive" | "Development") =>
                  setStatus(value)
                }
              >
                <SelectTrigger id='status'>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Active'>Active</SelectItem>
                  <SelectItem value='Inactive'>Inactive</SelectItem>
                  <SelectItem value='Development'>Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className='mt-6'>
          <CardHeader>
            <CardTitle>Advanced Configuration</CardTitle>
            <CardDescription>
              Configure detailed settings for your application
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <Label htmlFor='token-lifetime'>Access Token Lifetime</Label>
              <div className='flex items-center gap-2'>
                <Input
                  id='token-lifetime'
                  type='number'
                  value={accessTokenLifetime}
                  onChange={(e) =>
                    setAccessTokenLifetime(Number(e.target.value))
                  }
                  className='w-24'
                />
                <Select
                  value={accessTokenLifetimeUnit}
                  onValueChange={setAccessTokenLifetimeUnit}
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='Unit' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='seconds'>Seconds</SelectItem>
                    <SelectItem value='minutes'>Minutes</SelectItem>
                    <SelectItem value='hours'>Hours</SelectItem>
                    <SelectItem value='days'>Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='refresh-token-lifetime'>
                Refresh Token Lifetime
              </Label>
              <div className='flex items-center gap-2'>
                <Input
                  id='refresh-token-lifetime'
                  type='number'
                  value={refreshTokenLifetime}
                  onChange={(e) =>
                    setRefreshTokenLifetime(Number(e.target.value))
                  }
                  className='w-24'
                />
                <Select
                  value={refreshTokenLifetimeUnit}
                  onValueChange={setRefreshTokenLifetimeUnit}
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue placeholder='Unit' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='minutes'>Minutes</SelectItem>
                    <SelectItem value='hours'>Hours</SelectItem>
                    <SelectItem value='days'>Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Grant Types</Label>
              <div className='grid grid-cols-2 gap-2'>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='authorization-code'
                    className='h-4 w-4'
                    checked={grantTypes.includes("authorization_code")}
                    onChange={(e) =>
                      handleGrantTypeChange(
                        "authorization_code",
                        e.target.checked
                      )
                    }
                  />
                  <Label htmlFor='authorization-code' className='font-normal'>
                    Authorization Code
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='implicit'
                    className='h-4 w-4'
                    checked={grantTypes.includes("implicit")}
                    onChange={(e) =>
                      handleGrantTypeChange("implicit", e.target.checked)
                    }
                  />
                  <Label htmlFor='implicit' className='font-normal'>
                    Implicit
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='password'
                    className='h-4 w-4'
                    checked={grantTypes.includes("password")}
                    onChange={(e) =>
                      handleGrantTypeChange("password", e.target.checked)
                    }
                  />
                  <Label htmlFor='password' className='font-normal'>
                    Password
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='client-credentials'
                    className='h-4 w-4'
                    checked={grantTypes.includes("client_credentials")}
                    onChange={(e) =>
                      handleGrantTypeChange(
                        "client_credentials",
                        e.target.checked
                      )
                    }
                  />
                  <Label htmlFor='client-credentials' className='font-normal'>
                    Client Credentials
                  </Label>
                </div>
                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='refresh-token'
                    className='h-4 w-4'
                    checked={grantTypes.includes("refresh_token")}
                    onChange={(e) =>
                      handleGrantTypeChange("refresh_token", e.target.checked)
                    }
                  />
                  <Label htmlFor='refresh-token' className='font-normal'>
                    Refresh Token
                  </Label>
                </div>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Token Signing Algorithm</Label>
              <Select
                value={tokenSigningAlgorithm}
                onValueChange={setTokenSigningAlgorithm}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select algorithm' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='RS256'>RS256</SelectItem>
                  <SelectItem value='HS256'>HS256</SelectItem>
                  <SelectItem value='ES256'>ES256</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='cors-settings'>CORS Settings</Label>
              <Textarea
                id='cors-settings'
                placeholder='https://example.com, https://app.example.com'
                value={corsOrigins}
                onChange={(e) => setCorsOrigins(e.target.value)}
              />
              <p className='text-sm text-muted-foreground'>
                Comma-separated list of allowed origins for CORS requests
              </p>
            </div>
          </CardContent>
          <CardFooter className='flex justify-between'>
            <Button
              variant='outline'
              type='button'
              onClick={() =>
                router.push(`/admin/applications/${applicationId}`)
              }
            >
              Cancel
            </Button>
            <Button type='submit' disabled={isSaving}>
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
