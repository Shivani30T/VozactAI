import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { CreditCard, Check, Coins } from 'lucide-react';
import { User } from '../types';

interface BuyCreditsProps {
  currentUser: User;
  onCreditsPurchased: (amount: number) => void;
}

interface CreditPackage {
  id: string;
  amount: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

const creditPackages: CreditPackage[] = [
  { id: 'package-1', amount: 100, price: 10, bonus: 0 },
  { id: 'package-2', amount: 500, price: 45, bonus: 50, popular: true },
  { id: 'package-3', amount: 1000, price: 80, bonus: 150 },
  { id: 'package-4', amount: 5000, price: 350, bonus: 1000 },
];

export function BuyCredits({ currentUser, onCreditsPurchased }: BuyCreditsProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [customAmount, setCustomAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePurchase = async (amount: number) => {
    setProcessing(true);
    setSuccess(false);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      onCreditsPurchased(amount);
      setSuccess(true);
      setSelectedPackage('');
      setCustomAmount('');

      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePackagePurchase = (pkg: CreditPackage) => {
    setSelectedPackage(pkg.id);
    handlePurchase(pkg.amount + pkg.bonus);
  };

  const handleCustomPurchase = () => {
    const amount = parseInt(customAmount);
    if (amount > 0) {
      handlePurchase(amount);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl text-blue-900 mb-1">Buy Credits</h2>
        <p className="text-blue-700">Purchase credits to enable calling for your users</p>
      </div>

      {/* Current Balance */}
      <Card className="border-blue-200 shadow-lg bg-gradient-to-r from-blue-50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-lg">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Available Credits</p>
                <p className="text-3xl text-blue-900">{currentUser.credits?.toLocaleString() || 0}</p>
              </div>
            </div>
            {success && (
              <div className="flex items-center gap-2 bg-green-100 border border-green-300 px-4 py-2 rounded-md">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-800">Purchase Successful!</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div>
        <h3 className="text-lg text-blue-900 mb-4">Select a Package</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {creditPackages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
                pkg.popular
                  ? 'border-blue-600 shadow-md'
                  : 'border-blue-200 hover:border-blue-400'
              }`}
            >
              <CardHeader className="pb-3">
                {pkg.popular && (
                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full w-fit mb-2">
                    Most Popular
                  </div>
                )}
                <CardTitle className="text-2xl text-blue-900">
                  {pkg.amount.toLocaleString()}
                  {pkg.bonus > 0 && (
                    <span className="text-green-600 text-base ml-1">
                      +{pkg.bonus}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>Credits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl text-blue-900">${pkg.price}</p>
                  <p className="text-sm text-blue-600">
                    ${(pkg.price / (pkg.amount + pkg.bonus)).toFixed(3)} per credit
                  </p>
                </div>
                {pkg.bonus > 0 && (
                  <div className="bg-green-50 border border-green-200 p-2 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Bonus:</strong> +{pkg.bonus} credits
                    </p>
                  </div>
                )}
                <Button
                  onClick={() => handlePackagePurchase(pkg)}
                  disabled={processing}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {processing && selectedPackage === pkg.id ? (
                    'Processing...'
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Purchase
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="text-blue-900">Custom Amount</CardTitle>
          <CardDescription className="text-blue-700">
            Enter a custom number of credits
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="custom-credits" className="text-blue-900">
                Number of Credits
              </Label>
              <Input
                id="custom-credits"
                type="number"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="border-blue-200"
                min="1"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCustomPurchase}
                disabled={processing || !customAmount || parseInt(customAmount) <= 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {processing && !selectedPackage ? (
                  'Processing...'
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Purchase
                  </>
                )}
              </Button>
            </div>
          </div>
          {customAmount && parseInt(customAmount) > 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-300 p-3 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Total:</strong> ${(parseInt(customAmount) * 0.1).toFixed(2)} for{' '}
                {parseInt(customAmount).toLocaleString()} credits
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card className="border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
          <CardTitle className="text-blue-900">Payment Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-blue-700">
            <p>• Credits can be distributed to your users for making calls</p>
            <p>• Each call deducts 1 credit from the user's balance</p>
            <p>• Users earn credits back when calls are completed successfully</p>
            <p>• Credits never expire and can be used anytime</p>
            <p>• Secure payment processing with SSL encryption</p>
          </div>
        </CardContent>
      </Card>

      {/* API Integration Note */}
      <div className="bg-blue-50 border border-blue-300 p-4 rounded-md">
        <p className="text-sm text-blue-900">
          <strong>API Integration:</strong> POST /api/admin/credits/purchase
        </p>
        <p className="text-xs text-blue-700 mt-2">
          Send: {`{ "amount": number, "paymentMethod": "card" }`}
        </p>
      </div>
    </div>
  );
}
