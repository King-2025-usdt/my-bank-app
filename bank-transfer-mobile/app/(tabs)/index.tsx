import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#003d82',
  success: '#4ade80',
  error: '#ef4444',
  gray: '#e5e7eb',
  white: '#ffffff',
  text: '#000000',
  lightBg: '#f9fafb',
};

interface BeneficiaryData {
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
}

interface TransactionData {
  amount: string;
  currency: string;
  purpose: string;
}

interface Transaction {
  id: string;
  timestamp: string;
  beneficiary: BeneficiaryData;
  transaction: TransactionData;
  status: 'success' | 'failed';
  fees: number;
}

export default function HomeScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [beneficiary, setBeneficiary] = useState<BeneficiaryData>({
    beneficiaryName: '',
    bankName: '',
    accountNumber: '',
  });
  const [transaction, setTransaction] = useState<TransactionData>({
    amount: '',
    currency: 'SAR',
    purpose: '',
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionResult, setTransactionResult] = useState<{
    status: 'success' | 'failed';
    message: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const stored = await AsyncStorage.getItem('transactions');
      if (stored) {
        setTransactions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('خطأ في تحميل العمليات:', error);
    }
  };

  const saveTransaction = async (newTransaction: Transaction) => {
    try {
      const updated = [...transactions, newTransaction];
      await AsyncStorage.setItem('transactions', JSON.stringify(updated));
      setTransactions(updated);
    } catch (error) {
      console.error('خطأ في حفظ العملية:', error);
    }
  };

  const handleStep1Submit = () => {
    if (!beneficiary.beneficiaryName || !beneficiary.bankName || !beneficiary.accountNumber) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Submit = () => {
    if (!transaction.amount || parseFloat(transaction.amount) <= 0) {
      Alert.alert('خطأ', 'يرجى إدخال مبلغ صحيح');
      return;
    }
    setCurrentStep(3);
  };

  const handleStep3Submit = async () => {
    setIsLoading(true);
    try {
      // محاكاة معالجة العملية
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newTransaction: Transaction = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleString('ar-SA'),
        beneficiary,
        transaction,
        status: Math.random() > 0.3 ? 'success' : 'failed',
        fees: 50,
      };

      await saveTransaction(newTransaction);
      setTransactionResult({
        status: newTransaction.status,
        message: newTransaction.status === 'success' 
          ? 'تمت العملية بنجاح' 
          : 'فشلت العملية، يرجى المحاولة لاحقاً',
      });
      setCurrentStep(4);
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء معالجة العملية');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setBeneficiary({ beneficiaryName: '', bankName: '', accountNumber: '' });
    setTransaction({ amount: '', currency: 'SAR', purpose: '' });
    setTransactionResult(null);
  };

  const handleAdminLogin = () => {
    if (adminPassword === '1234') {
      setAdminMode(true);
      setShowAdminModal(false);
      setAdminPassword('');
      Alert.alert('نجح', 'تم تسجيل الدخول إلى لوحة التحكم');
    } else {
      Alert.alert('خطأ', 'كلمة المرور غير صحيحة');
      setAdminPassword('');
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>الخطوة 1: بيانات المستفيد</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>اسم المستفيد</Text>
        <TextInput
          style={styles.input}
          placeholder="أدخل اسم المستفيد"
          value={beneficiary.beneficiaryName}
          onChangeText={(text) => setBeneficiary({ ...beneficiary, beneficiaryName: text })}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>اسم البنك</Text>
        <TextInput
          style={styles.input}
          placeholder="أدخل اسم البنك"
          value={beneficiary.bankName}
          onChangeText={(text) => setBeneficiary({ ...beneficiary, bankName: text })}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>رقم الحساب / IBAN</Text>
        <TextInput
          style={styles.input}
          placeholder="أدخل رقم الحساب أو IBAN"
          value={beneficiary.accountNumber}
          onChangeText={(text) => setBeneficiary({ ...beneficiary, accountNumber: text })}
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleStep1Submit}
      >
        <Text style={styles.buttonText}>حفظ ومتابعة</Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>الخطوة 2: إدخال المبلغ</Text>

      <View style={styles.currencyContainer}>
        {['SAR', 'USD', 'EUR', 'GBP', 'AED'].map((curr) => (
          <TouchableOpacity
            key={curr}
            style={[
              styles.currencyButton,
              transaction.currency === curr && styles.currencyButtonActive,
            ]}
            onPress={() => setTransaction({ ...transaction, currency: curr })}
          >
            <Text
              style={[
                styles.currencyButtonText,
                transaction.currency === curr && styles.currencyButtonTextActive,
              ]}
            >
              {curr}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>المبلغ</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          value={transaction.amount}
          onChangeText={(text) => setTransaction({ ...transaction, amount: text })}
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>غرض التحويل</Text>
        <TextInput
          style={styles.input}
          placeholder="أدخل غرض التحويل"
          value={transaction.purpose}
          onChangeText={(text) => setTransaction({ ...transaction, purpose: text })}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => setCurrentStep(1)}
        >
          <Text style={styles.buttonTextSecondary}>رجوع</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStep2Submit}
        >
          <Text style={styles.buttonText}>متابعة</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>الخطوة 3: تأكيد البيانات</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>ملخص التحويل</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>المستفيد:</Text>
          <Text style={styles.summaryValue}>{beneficiary.beneficiaryName}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>البنك:</Text>
          <Text style={styles.summaryValue}>{beneficiary.bankName}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>الحساب:</Text>
          <Text style={styles.summaryValue}>
            {beneficiary.accountNumber.slice(0, 4)}****{beneficiary.accountNumber.slice(-4)}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>المبلغ:</Text>
          <Text style={[styles.summaryValue, { color: COLORS.primary, fontWeight: 'bold' }]}>
            {transaction.amount} {transaction.currency}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>الرسوم:</Text>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>50 ريال</Text>
        </View>
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => setCurrentStep(2)}
        >
          <Text style={styles.buttonTextSecondary}>رجوع</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStep3Submit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'جاري المعالجة...' : 'تأكيد التحويل'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.resultContainer}>
        {transactionResult?.status === 'success' ? (
          <>
            <View style={[styles.resultIcon, { backgroundColor: COLORS.success }]}>
              <Ionicons name="checkmark-circle" size={60} color={COLORS.white} />
            </View>
            <Text style={styles.resultTitle}>تمت العملية بنجاح!</Text>
            <Text style={styles.resultMessage}>
              تم تحويل المبلغ {transaction.amount} {transaction.currency} إلى {beneficiary.beneficiaryName}
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.resultIcon, { backgroundColor: COLORS.error }]}>
              <Ionicons name="close-circle" size={60} color={COLORS.white} />
            </View>
            <Text style={[styles.resultTitle, { color: COLORS.error }]}>فشلت العملية</Text>
            <Text style={styles.resultMessage}>
              حدث خطأ أثناء معالجة التحويل. يرجى المحاولة لاحقاً.
            </Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={resetForm}
      >
        <Text style={styles.buttonText}>تحويل جديد</Text>
      </TouchableOpacity>
    </View>
  );

  if (adminMode) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setAdminMode(false)}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>لوحة التحكم الإدارية</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.sectionTitle}>سجل العمليات</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد عمليات حتى الآن</Text>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.transactionItem}>
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionBeneficiary}>{item.beneficiary.beneficiaryName}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: item.status === 'success' ? COLORS.success : COLORS.error },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {item.status === 'success' ? 'نجح' : 'فشل'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.transactionAmount}>
                    {item.transaction.amount} {item.transaction.currency}
                  </Text>
                  <Text style={styles.transactionTime}>{item.timestamp}</Text>
                </View>
              )}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <Ionicons name="menu" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مصرف الراجحي</Text>
        <TouchableOpacity onPress={() => setShowAdminModal(true)}>
          <Ionicons name="notifications" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        {[1, 2, 3, 4].map((step) => (
          <View key={step} style={styles.progressItem}>
            <View
              style={[
                styles.progressStep,
                {
                  backgroundColor:
                    step <= currentStep ? COLORS.primary : COLORS.gray,
                },
              ]}
            >
              {step < currentStep ? (
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              ) : (
                <Text style={styles.progressStepText}>{step}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Admin Modal */}
      <Modal
        visible={showAdminModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>لوحة التحكم الإدارية</Text>
            <TextInput
              style={styles.input}
              placeholder="أدخل كلمة المرور"
              secureTextEntry
              value={adminPassword}
              onChangeText={setAdminPassword}
              placeholderTextColor="#999"
            />
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setShowAdminModal(false);
                  setAdminPassword('');
                }}
              >
                <Text style={styles.buttonTextSecondary}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={handleAdminLogin}
              >
                <Text style={styles.buttonText}>دخول</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightBg,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
  progressStepText: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    textAlign: 'right',
  },
  amountInput: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  currencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  currencyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
    backgroundColor: COLORS.white,
  },
  currencyButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  currencyButtonText: {
    color: COLORS.text,
    fontWeight: '600',
  },
  currencyButtonTextActive: {
    color: COLORS.white,
  },
  summaryCard: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'right',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray,
    marginVertical: 8,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonTextSecondary: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  resultContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  resultIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 8,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  transactionItem: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionBeneficiary: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'right',
  },
});
