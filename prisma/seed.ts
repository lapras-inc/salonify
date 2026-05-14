import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash('password123', 10);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: { email: 'owner@example.com', passwordHash: pw, displayName: '山田オーナー' },
  });
  const member = await prisma.user.upsert({
    where: { email: 'member@example.com' },
    update: {},
    create: { email: 'member@example.com', passwordHash: pw, displayName: '鈴木メンバー' },
  });

  // Skip if already seeded
  const existing = await prisma.salon.findFirst({ where: { ownerId: owner.id } });
  if (existing) { console.log('already seeded'); return; }

  const salon = await prisma.salon.create({
    data: {
      ownerId: owner.id,
      name: 'テック起業ラボ',
      tagline: 'エンジニア出身の起業家のための実践コミュニティ',
      description: 'スタートアップ立ち上げのノウハウを共有します。\n\n毎週ライブ勉強会を開催。',
      category: 'ビジネス',
      visibility: 'public',
      plans: {
        create: [
          { name: 'ライト', priceJpy: 980 },
          { name: 'スタンダード', priceJpy: 2980, description: '全コンテンツ + 月1面談' },
        ],
      },
    },
    include: { plans: true },
  });

  const nextBill = new Date();
  nextBill.setDate(nextBill.getDate() + 30);
  const ms = await prisma.membership.create({
    data: {
      userId: member.id,
      salonId: salon.id,
      planId: salon.plans[0].id,
      nextBillAt: nextBill,
    },
  });
  await prisma.invoice.create({ data: { membershipId: ms.id, amountJpy: 980, status: 'paid' } });

  await prisma.post.create({
    data: {
      salonId: salon.id,
      authorId: owner.id,
      title: 'ようこそ！',
      bodyHtml: '<p>はじめまして。このサロンでは起業の実践ノウハウを共有します。</p>',
      pinned: true,
    },
  });
  await prisma.thread.create({
    data: {
      salonId: salon.id,
      authorId: member.id,
      title: '自己紹介スレ',
      body: 'よろしくお願いします！',
    },
  });

  console.log('Seeded:');
  console.log('  owner@example.com / password123');
  console.log('  member@example.com / password123');
}

main().finally(() => prisma.$disconnect());
