import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../lib/store/authStore';
import { useCategories, useAddCategory } from '../../lib/hooks/useCategories';
import { supabase } from '../../lib/supabase';
import type { Category, BudgetBucket } from '../../types';
import { Colors, CategoryColors, BucketColors, FontSize, Spacing, Radius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

const BUCKET_OPTIONS: { value: BudgetBucket; label: string; description: string }[] = [
  { value: 'needs', label: 'Needs', description: 'Rent, groceries, utilities' },
  { value: 'wants', label: 'Wants', description: 'Dining, entertainment, hobbies' },
  { value: 'savings', label: 'Savings', description: 'Investments, emergency fund' },
  { value: 'income', label: 'Income', description: 'Salary, freelance, dividends' },
];

const EMOJI_OPTIONS = ['🏠', '🛒', '💡', '🚗', '🍽️', '🎬', '👗', '💊', '📚', '✈️', '💪', '🐾', '💰', '📈', '🎮', '☕', '🎁', '🏥', '🎓', '🔧'];

function CategoryRow({
  category,
  onDelete,
}: {
  category: Category;
  onDelete: (id: string) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: Radius.full,
          backgroundColor: category.color + '33',
          borderWidth: 1,
          borderColor: category.color + '66',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: Spacing.sm,
        }}
      >
        <Text style={{ fontSize: 18 }}>{category.icon ?? '📁'}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.white, fontSize: FontSize.base, fontWeight: '600' }}>
          {category.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Badge
            label={category.bucket}
            color={BucketColors[category.bucket]}
          />
          {category.budget_amount > 0 && (
            <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>
              Budget: ${category.budget_amount}/mo
            </Text>
          )}
        </View>
      </View>

      <Pressable
        onPress={() => onDelete(category.id)}
        hitSlop={8}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
      >
        <Text style={{ color: Colors.danger, fontSize: FontSize.md }}>✕</Text>
      </Pressable>
    </View>
  );
}

export default function CategoriesScreen() {
  const { user } = useAuthStore();
  const userId = user?.id ?? '';
  const qc = useQueryClient();

  const { data: categories = [], isLoading } = useCategories(userId);
  const addCategory = useAddCategory();

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [selectedBucket, setSelectedBucket] = useState<BudgetBucket>('wants');
  const [selectedEmoji, setSelectedEmoji] = useState('📁');
  const [selectedColor, setSelectedColor] = useState(CategoryColors[0]);
  const [error, setError] = useState('');

  function handleDelete(id: string) {
    Alert.alert('Delete Category', 'Transactions in this category will become uncategorized.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCategory.mutate(id),
      },
    ]);
  }

  async function handleAdd() {
    setError('');
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }
    await addCategory.mutateAsync({
      user_id: userId,
      name: name.trim(),
      icon: selectedEmoji,
      color: selectedColor,
      bucket: selectedBucket,
      budget_amount: parseFloat(budget) || 0,
    });
    setModalVisible(false);
    setName(''); setBudget(''); setSelectedBucket('wants');
    setSelectedEmoji('📁'); setSelectedColor(CategoryColors[0]);
  }

  const grouped = BUCKET_OPTIONS.map((b) => ({
    ...b,
    items: categories.filter((c) => c.bucket === b.value),
  })).filter((g) => g.items.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingBottom: 0 }}>
        <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700' }}>
          Categories
        </Text>
        <Pressable
          onPress={() => setModalVisible(true)}
          style={{ backgroundColor: Colors.accent, borderRadius: 20, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs }}
        >
          <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: '700' }}>+ Add</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing['2xl'] }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: Spacing['2xl'] }}>
          {grouped.length === 0 ? (
            <Card>
              <Text style={{ color: Colors.muted, textAlign: 'center', fontSize: FontSize.sm }}>
                No categories yet. Add one to start tracking spending by bucket.
              </Text>
            </Card>
          ) : (
            grouped.map((group) => (
              <View key={group.value} style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs, gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: BucketColors[group.value] }} />
                  <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {group.label}
                  </Text>
                  <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>— {group.description}</Text>
                </View>
                <Card padding={0}>
                  {group.items.map((cat, i) => (
                    <View key={cat.id}>
                      <CategoryRow category={cat} onDelete={handleDelete} />
                      {i < group.items.length - 1 && (
                        <View style={{ height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md }} />
                      )}
                    </View>
                  ))}
                </Card>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Category Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={{
              backgroundColor: Colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: Spacing.lg,
              borderWidth: 1,
              borderColor: Colors.border,
              maxHeight: '90%',
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={{ color: Colors.white, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.md }}>
                New Category
              </Text>

              {/* Name */}
              <Input
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Rent, Groceries"
                containerStyle={{ marginBottom: Spacing.md }}
              />

              {/* Emoji picker */}
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs }}>
                Icon
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {EMOJI_OPTIONS.map((emoji) => (
                    <Pressable
                      key={emoji}
                      onPress={() => setSelectedEmoji(emoji)}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selectedEmoji === emoji ? Colors.accent + '44' : Colors.card,
                        borderWidth: 1,
                        borderColor: selectedEmoji === emoji ? Colors.accent : Colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 22 }}>{emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {/* Color picker */}
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs }}>
                Color
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md }}>
                {CategoryColors.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: color,
                      borderWidth: selectedColor === color ? 3 : 0,
                      borderColor: Colors.white,
                    }}
                  />
                ))}
              </View>

              {/* Bucket */}
              <Text style={{ color: Colors.muted, fontSize: FontSize.sm, fontWeight: '500', marginBottom: Spacing.xs }}>
                50/30/20 Bucket
              </Text>
              <View style={{ gap: 6, marginBottom: Spacing.md }}>
                {BUCKET_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSelectedBucket(opt.value)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: Spacing.sm,
                      borderRadius: Radius.md,
                      borderWidth: 1,
                      borderColor: selectedBucket === opt.value ? BucketColors[opt.value] : Colors.border,
                      backgroundColor: selectedBucket === opt.value ? BucketColors[opt.value] + '22' : Colors.card,
                      gap: 10,
                    }}
                  >
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: BucketColors[opt.value] }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: Colors.white, fontSize: FontSize.sm, fontWeight: '600' }}>{opt.label}</Text>
                      <Text style={{ color: Colors.muted, fontSize: FontSize.xs }}>{opt.description}</Text>
                    </View>
                    {selectedBucket === opt.value && (
                      <Text style={{ color: BucketColors[opt.value], fontSize: FontSize.base }}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>

              {/* Monthly budget */}
              <Input
                label="Monthly Budget ($) — optional"
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                placeholder="0"
                containerStyle={{ marginBottom: Spacing.md }}
              />

              {error ? (
                <Text style={{ color: Colors.danger, fontSize: FontSize.sm, marginBottom: Spacing.sm }}>{error}</Text>
              ) : null}

              <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                <Button label="Cancel" onPress={() => setModalVisible(false)} variant="secondary" style={{ flex: 1 }} />
                <Button label="Add Category" onPress={handleAdd} loading={addCategory.isPending} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
