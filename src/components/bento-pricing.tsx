'use client';

import React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, SparklesIcon } from 'lucide-react';

export type PricingCardProps = {
	titleBadge: string;
	priceLabel: string;
	priceSuffix?: string;
	features: string[];
	cta?: string;
	/** เมื่อมีค่า ปุ่ม CTA จะเป็น Link ไปที่ href */
	ctaHref?: string;
	className?: string;
};

function FilledCheck() {
	return (
		<div className="bg-primary text-primary-foreground rounded-full p-0.5">
			<CheckIcon className="size-3" strokeWidth={3} />
		</div>
	);
}

export function PricingCard({
	titleBadge,
	priceLabel,
	priceSuffix = '/month',
	features,
	cta = 'Subscribe',
	ctaHref,
	className,
}: PricingCardProps) {
	const ctaNode = ctaHref ? (
		<Button variant="outline" asChild>
			<Link href={ctaHref}>{cta}</Link>
		</Button>
	) : (
		<Button variant="outline">{cta}</Button>
	);

	return (
		<div
			className={cn(
				'bg-background border-foreground/10 relative overflow-hidden rounded-md border',
				'supports-[backdrop-filter]:bg-background/10 backdrop-blur',
				className,
			)}
		>
			<div className="flex items-center gap-3 p-4">
				<Badge variant="secondary">{titleBadge}</Badge>
				<div className="ml-auto">{ctaNode}</div>
			</div>

			<div className="flex items-end gap-2 px-4 py-2">
				<span className="font-mono text-5xl font-semibold tracking-tight">
					{priceLabel}
				</span>
				{priceLabel.toLowerCase() !== 'free' && (
					<span className="text-muted-foreground text-sm">{priceSuffix}</span>
				)}
			</div>

			<ul className="text-muted-foreground grid gap-4 p-4 text-sm">
				{features.map((f, i) => (
					<li key={i} className="flex items-center gap-3">
						<FilledCheck />
						<span>{f}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

/** แผนสมาชิกสำหรับ landing — รับ plans จาก API แล้วเรนเดอร์เป็น bento grid */
export type MembershipPlanForBento = {
	id: number;
	name: string;
	billingType: string;
	price: number;
	freeRentalDays: number;
	discountPercent: number;
	description: string | null;
};

function formatMoney(n: number) {
	return new Intl.NumberFormat('th-TH', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(n);
}

export function MembershipBentoPricing({ plans }: { plans: MembershipPlanForBento[] }) {
	if (plans.length === 0) return null;

	const monthlyLabel = '/เดือน';
	const yearlyLabel = '/ปี';
	const featured = plans.find((p) => p.billingType === 'yearly') ?? plans[0];
	const others = plans.filter((p) => p.id !== featured.id);

	function buildFeatures(p: MembershipPlanForBento): string[] {
		const list: string[] = [];
		if (p.freeRentalDays > 0) list.push(`ได้วันเช่าฟรี ${p.freeRentalDays} วัน`);
		if (p.discountPercent > 0) list.push(`ส่วนลด ${p.discountPercent}% ทุกครั้งที่เช่า`);
		if (p.description?.trim()) list.push(p.description.trim());
		return list.length > 0 ? list : ['ใช้สิทธิ์เมื่อเช่าของ'];
	}

	const featuredSpan = others.length === 0 ? 'lg:col-span-8' : 'lg:col-span-5';

	return (
		<div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-8">
			{/* การ์ดโปรเด่น (แผนรายปีหรือแผนแรก) */}
			<div
				className={cn(
					'bg-background border-foreground/10 relative w-full overflow-hidden rounded-md border',
					'supports-[backdrop-filter]:bg-background/10 backdrop-blur',
					featuredSpan,
				)}
			>
				<div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
					<div className="from-foreground/5 to-foreground/2 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
						<div
							aria-hidden="true"
							className={cn(
								'absolute inset-0 size-full mix-blend-overlay',
								'bg-[linear-gradient(to_right,--theme(--color-foreground/.1)_1px,transparent_1px)]',
								'bg-[size:24px]',
							)}
						/>
					</div>
				</div>
				<div className="relative flex items-center gap-3 p-4">
					<Badge variant="secondary">{featured.name}</Badge>
					<Badge variant="outline" className="hidden lg:flex">
						<SparklesIcon className="me-1 size-3" /> แนะนำ
					</Badge>
					<div className="ml-auto">
						<Button asChild>
							<Link href={`/membership/checkout?planId=${featured.id}`}>สมัคร</Link>
						</Button>
					</div>
				</div>
				<div className="relative flex flex-col p-4 lg:flex-row">
					<div className="pb-4 lg:w-[30%]">
						<span className="font-mono text-5xl font-semibold tracking-tight">
							{formatMoney(featured.price)}
						</span>
						<span className="text-muted-foreground text-sm">
							{featured.billingType === 'yearly' ? yearlyLabel : monthlyLabel}
						</span>
					</div>
					<ul className="text-muted-foreground grid gap-4 text-sm lg:w-[70%]">
						{buildFeatures(featured).map((f, i) => (
							<li key={i} className="flex items-center gap-3">
								<FilledCheck />
								<span className="leading-relaxed">{f}</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			{/* การ์ดแผนอื่น */}
			{others.slice(0, 2).map((plan) => (
				<PricingCard
					key={plan.id}
					titleBadge={plan.name}
					priceLabel={formatMoney(plan.price)}
					priceSuffix={plan.billingType === 'yearly' ? '/ปี' : '/เดือน'}
					features={buildFeatures(plan)}
					cta="สมัคร"
					ctaHref={`/membership/checkout?planId=${plan.id}`}
					className="lg:col-span-3"
				/>
			))}
		</div>
	);
}

export function BentoPricing() {
	return (
		<div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-8">
			<div
				className={cn(
					'bg-background border-foreground/10 relative w-full overflow-hidden rounded-md border',
					'supports-[backdrop-filter]:bg-background/10 backdrop-blur',
					'lg:col-span-5',
				)}
			>
				<div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
					<div className="from-foreground/5 to-foreground/2 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]">
						<div
							aria-hidden="true"
							className={cn(
								'absolute inset-0 size-full mix-blend-overlay',
								'bg-[linear-gradient(to_right,--theme(--color-foreground/.1)_1px,transparent_1px)]',
								'bg-[size:24px]',
							)}
						/>
					</div>
				</div>
				<div className="flex items-center gap-3 p-4">
					<Badge variant="secondary">CREATORS SPECIAL</Badge>
					<Badge variant="outline" className="hidden lg:flex">
						<SparklesIcon className="me-1 size-3" /> Most Recommended
					</Badge>
					<div className="ml-auto">
						<Button>Subscribe</Button>
					</div>
				</div>
				<div className="flex flex-col p-4 lg:flex-row">
					<div className="pb-4 lg:w-[30%]">
						<span className="font-mono text-5xl font-semibold tracking-tight">
							$19
						</span>
						<span className="text-muted-foreground text-sm">/month</span>
					</div>
					<ul className="text-muted-foreground grid gap-4 text-sm lg:w-[70%]">
						{[
							'Perfect for individual bloggers',
							'freelancers and entrepreneurs',
							'AI-Powered editing tools',
							'Basic Analytics to track content performance',
						].map((f, i) => (
							<li key={i} className="flex items-center gap-3">
								<FilledCheck />
								<span className="leading-relaxed">{f}</span>
							</li>
						))}
					</ul>
				</div>
			</div>

			<PricingCard
				titleBadge="STARTERS"
				priceLabel="$0"
				features={[
					'Perfect for beginners',
					'Unlimited Content Generation',
					'AI-Powered editing tools',
				]}
				className="lg:col-span-3"
			/>

			<PricingCard
				titleBadge="TEAMS"
				priceLabel="$49"
				features={[
					'Ideal for small teams and agencies',
					'Collaborative features like shared projects',
					'Advanced Analytics to optimize content strategy',
				]}
				className="lg:col-span-4"
			/>

			<PricingCard
				titleBadge="ENTERPRISE"
				priceLabel="$99"
				features={[
					'Designed for large companies',
					'high-volume content creators',
					'dedicated account management',
				]}
				className="lg:col-span-4"
			/>
		</div>
	);
}
