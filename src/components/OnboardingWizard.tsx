import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Stepper, Step, StepLabel, StepContent,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onFinish: () => void;
}

const steps = ['wizard.stepSettings', 'wizard.stepCustomer', 'wizard.stepInvoice'] as const;

export default function OnboardingWizard({ open, onFinish }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(s => s + 1);
    } else {
      onFinish();
    }
  };

  const handleBack = () => {
    setActiveStep(s => s - 1);
  };

  const stepContent = [
    {
      icon: <SettingsIcon color="primary" sx={{ fontSize: 48 }} />,
      title: t('wizard.stepSettingsTitle'),
      description: t('wizard.stepSettingsDesc'),
      action: t('settings.title'),
      path: '/settings',
    },
    {
      icon: <PersonAddIcon color="primary" sx={{ fontSize: 48 }} />,
      title: t('wizard.stepCustomerTitle'),
      description: t('wizard.stepCustomerDesc'),
      action: t('customers.title'),
      path: '/customers',
    },
    {
      icon: <ReceiptLongIcon color="primary" sx={{ fontSize: 48 }} />,
      title: t('wizard.stepInvoiceTitle'),
      description: t('wizard.stepInvoiceDesc'),
      action: t('invoices.new'),
      path: '/invoices/new',
    },
  ];

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>{t('wizard.title')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('wizard.subtitle')}
        </Typography>

        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((labelKey, index) => (
            <Step key={labelKey}>
              <StepLabel>
                <Typography variant="subtitle2">{t(labelKey)}</Typography>
              </StepLabel>
              <StepContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {stepContent[index].icon}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {stepContent[index].title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stepContent[index].description}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      navigate(stepContent[index].path);
                      handleNext();
                    }}
                  >
                    {stepContent[index].action}
                  </Button>
                  <Button size="small" onClick={handleNext} sx={{ ml: 1 }}>
                    {t('common.skip') || 'Skip'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>
      <DialogActions>
        {activeStep > 0 && (
          <Button onClick={handleBack}>{t('common.back')}</Button>
        )}
        <Button variant="contained" onClick={onFinish}>
          {activeStep === steps.length - 1 ? t('wizard.finish') : t('common.skip') || 'Skip all'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
