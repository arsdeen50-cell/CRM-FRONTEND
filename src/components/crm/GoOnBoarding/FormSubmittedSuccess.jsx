import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const FormSubmittedSuccess = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          
          <div className="text-green-500 text-5xl mb-3">✅</div>

          <h3 className="text-lg font-semibold text-gray-900">
            Form Submitted Successfully!
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            Thank you for submitting your details. We will contact you soon.
          </p>

        </CardContent>
      </Card>
    </div>
  );
};

export default FormSubmittedSuccess;