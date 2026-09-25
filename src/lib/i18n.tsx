'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Lang = 'EN' | 'BN';

/** Full translation dictionary */
const DICT = {
  // ── NAVBAR ────────────────────────────────────────────────────────────────
  nav_buy:            { EN: 'Buy',            BN: 'কিনুন' },
  nav_rent:           { EN: 'Rent',           BN: 'ভাড়া নিন' },
  nav_lease:          { EN: 'Lease',          BN: 'লিজ নিন' },
  nav_plots:          { EN: 'Plots',          BN: 'প্লট' },
  nav_hotels:         { EN: 'Hotels',         BN: 'হোটেল' },
  nav_dashboard:      { EN: 'Dashboard',      BN: 'ড্যাশবোর্ড' },
  nav_sign_in:        { EN: 'Sign In',        BN: 'সাইন ইন' },
  nav_post_property:  { EN: 'Post Property',  BN: 'সম্পত্তি পোস্ট' },
  nav_create_account: { EN: 'Create Account', BN: 'অ্যাকাউন্ট তৈরি করুন' },
  nav_light_mode:     { EN: 'Light Mode',     BN: 'হালকা মোড' },
  nav_dark_mode:      { EN: 'Dark Mode',      BN: 'অন্ধকার মোড' },
  nav_post_short:     { EN: 'Post',           BN: 'পোস্ট' },
  switch_to_bangla:   { EN: 'বাংলা',          BN: 'English' },

  // ── HERO / SEARCH ─────────────────────────────────────────────────────────
  search_purpose_buy:       { EN: 'Buy',            BN: 'কিনুন' },
  search_purpose_rent:      { EN: 'Rent',           BN: 'ভাড়া নিন' },
  search_purpose_lease:     { EN: 'Lease',          BN: 'লিজ নিন' },
  search_label_division:    { EN: 'Division',       BN: 'বিভাগ' },
  search_label_district:    { EN: 'District',       BN: 'জেলা' },
  search_all_bangladesh:    { EN: 'All Bangladesh', BN: 'সমগ্র বাংলাদেশ' },
  search_select_division:   { EN: 'Select Division',BN: 'বিভাগ নির্বাচন করুন' },
  search_select_district:   { EN: 'Select District',BN: 'জেলা নির্বাচন করুন' },
  search_label_category:    { EN: 'Category',       BN: 'ধরন' },
  search_all_categories:    { EN: 'All Categories', BN: 'সব ধরন' },
  search_cat_flat:          { EN: 'Flat / Apartment',       BN: 'ফ্ল্যাট / অ্যাপার্টমেন্ট' },
  search_cat_house:         { EN: 'House / Bari',           BN: 'বাড়ি / বাড়ী' },
  search_cat_land:          { EN: 'Land / Jomi',            BN: 'জমি / জমা' },
  search_cat_mess:          { EN: 'Mess / Hostel',          BN: 'মেস / হোস্টেল' },
  search_cat_hotel:         { EN: 'Hotel / Short Stay',     BN: 'হোটেল / শর্ট স্টে' },
  search_label_budget:      { EN: 'Budget',         BN: 'বাজেট' },
  search_any_budget:        { EN: 'Any Budget',     BN: 'যেকোনো বাজেট' },
  search_btn:               { EN: 'Search',         BN: 'খুঁজুন' },
  search_gps_hint:          { EN: 'Press the compass icon to auto-sort listings by your GPS location',
                              BN: 'কম্পাস আইকন চাপুন — আপনার জিপিএস অবস্থান অনুযায়ী তালিকা সাজানো হবে' },

  // Buy budgets
  budget_buy_under50l:  { EN: 'Under ৳ 50 Lakh',      BN: '৳ ৫০ লাখের নিচে' },
  budget_buy_50l1cr:    { EN: '৳ 50L – ৳ 1 Crore',    BN: '৳ ৫০ লাখ – ৳ ১ কোটি' },
  budget_buy_1cr3cr:    { EN: '৳ 1 – ৳ 3 Crore',      BN: '৳ ১ – ৳ ৩ কোটি' },
  budget_buy_above3cr:  { EN: 'Above ৳ 3 Crore',       BN: '৳ ৩ কোটির উপরে' },
  // Rent budgets
  budget_rent_u15k:     { EN: 'Under ৳ 15,000/mo',    BN: '৳ ১৫,০০০/মাসের নিচে' },
  budget_rent_15k40k:   { EN: '৳ 15K – ৳ 40K/mo',    BN: '৳ ১৫ হাজার – ৪০ হাজার/মাস' },
  budget_rent_40k1l:    { EN: '৳ 40K – ৳ 1L/mo',     BN: '৳ ৪০ হাজার – ১ লাখ/মাস' },
  budget_rent_above1l:  { EN: 'Above ৳ 1 Lakh/mo',   BN: '৳ ১ লাখ/মাসের উপরে' },

  // ── PROPERTY CARD ─────────────────────────────────────────────────────────
  card_for_sale:      { EN: 'For Sale',     BN: 'বিক্রয়ের জন্য' },
  card_for_rent:      { EN: 'For Rent',     BN: 'ভাড়ার জন্য' },
  card_lease:         { EN: 'Lease',        BN: 'লিজ' },
  card_cat_flat:      { EN: 'Flat',         BN: 'ফ্ল্যাট' },
  card_cat_house:     { EN: 'House',        BN: 'বাড়ি' },
  card_cat_land:      { EN: 'Land',         BN: 'জমি' },
  card_cat_mess:      { EN: 'Mess',         BN: 'মেস' },
  card_cat_hotel:     { EN: 'Hotel',        BN: 'হোটেল' },
  card_verified:      { EN: 'Verified',     BN: 'যাচাইকৃত' },
  card_negotiable:    { EN: 'Negotiable',   BN: 'দরদামযোগ্য' },
  card_beds:          { EN: 'Beds',         BN: 'বেড' },
  card_baths:         { EN: 'Baths',        BN: 'বাথ' },
  card_details:       { EN: 'Details',      BN: 'বিস্তারিত' },
  card_rajuk:         { EN: 'RAJUK',        BN: 'রাজউক' },
  card_titas:         { EN: 'Titas',        BN: 'তিতাস' },
  card_views:         { EN: 'views',        BN: 'বার দেখা হয়েছে' },
  seller_owner:       { EN: 'Owner',        BN: 'মালিক' },
  seller_developer:   { EN: 'Developer',    BN: 'ডেভেলপার' },
  seller_agency:      { EN: 'Agency',       BN: 'এজেন্সি' },

  // ── HOME PAGE SECTIONS ────────────────────────────────────────────────────
  home_hero_badge:      { EN: "Bangladesh's #1 Premium Real Estate Marketplace",
                          BN: 'বাংলাদেশের #১ প্রিমিয়াম রিয়েল এস্টেট মার্কেটপ্লেস' },
  home_hero_h1a:        { EN: 'Find Your Dream',    BN: 'আপনার স্বপ্নের' },
  home_hero_h1b:        { EN: 'Property',           BN: 'সম্পত্তি' },
  home_hero_h1c:        { EN: 'Across Bangladesh',  BN: 'সারা বাংলাদেশে খুঁজুন' },
  home_hero_sub:        { EN: 'Buy, sell & rent verified flats, houses, land, mess rooms, and hotels.',
                          BN: 'যাচাইকৃত ফ্ল্যাট, বাড়ি, জমি, মেস রুম এবং হোটেল কিনুন, বিক্রি করুন ও ভাড়া নিন।' },
  home_hero_sub2:       { EN: '100% direct owner contact. Zero hidden charges.',
                          BN: '১০০% সরাসরি মালিকের সাথে যোগাযোগ। কোনো লুকানো চার্জ নেই।' },
  home_trust_listings:  { EN: '1,500+ Active Listings',  BN: '১,৫০০+ সক্রিয় তালিকা' },
  home_trust_districts: { EN: '64 Districts',            BN: '৬৪ জেলা' },
  home_trust_users:     { EN: '50,000+ Monthly Users',   BN: '৫০,০০০+ মাসিক ব্যবহারকারী' },
  home_trust_rajuk:     { EN: 'Document Verified',       BN: 'কাগজপত্র যাচাইকৃত' },

  home_cat_title:       { EN: 'Browse by Category',         BN: 'ধরন অনুযায়ী খুঁজুন' },
  home_cat_sub:         { EN: 'Everything you need, in one place', BN: 'আপনার প্রয়োজনীয় সব কিছু এক জায়গায়' },

  home_featured_badge:  { EN: 'Premium Listings',      BN: 'প্রিমিয়াম তালিকা' },
  home_featured_title:  { EN: 'Featured Properties',   BN: 'বাছাইকৃত সম্পত্তি' },
  home_view_all:        { EN: 'View All',               BN: 'সব দেখুন' },

  home_cities_title:    { EN: 'Explore Top Cities',              BN: 'শীর্ষ শহর অন্বেষণ করুন' },
  home_cities_sub:      { EN: 'Covering all 64 districts of Bangladesh', BN: 'বাংলাদেশের সকল ৬৪ জেলা জুড়ে' },

  home_why_title:       { EN: 'Why Plotify?',  BN: 'কেন প্লটিফাই?' },
  home_why_sub:         { EN: 'Built for Bangladesh — with features no other platform offers',
                          BN: 'বাংলাদেশের জন্য তৈরি — আধুনিক ও নির্ভরযোগ্য সুবিধা নিয়ে' },

  home_recent_badge:    { EN: 'Just Listed',          BN: 'নতুন তালিকাভুক্ত' },
  home_recent_title:    { EN: 'Newest Properties',    BN: 'সর্বশেষ সম্পত্তি' },

  home_testimonials_title: { EN: 'What Our Users Say',              BN: 'গ্রাহকদের মতামত' },
  home_testimonials_sub:   { EN: 'Trusted by thousands across Bangladesh', BN: 'সারা বাংলাদেশের হাজারো সন্তুষ্ট গ্রাহক' },

  home_cta_title:       { EN: 'Ready to List Your Property?',   BN: 'আপনার সম্পত্তি তালিকাভুক্ত করতে চান?' },
  home_cta_sub:         { EN: 'Reach 50,000+ verified buyers and tenants. Our flat listing fee is just',
                          BN: '৫০,০০০+ যাচাইকৃত ক্রেতা ও ভাড়াটেদের কাছে পৌঁছান। তালিকা ফি মাত্র' },
  home_cta_fee:         { EN: 'Tk 500–Tk 5,000',  BN: '৳ ৫০০–৳ ৫,০০০' },
  home_cta_sub2:        { EN: '— one of the most affordable in Bangladesh.',
                          BN: '— যা দেশের সবচেয়ে সাশ্রয়ী।' },
  home_cta_btn_post:    { EN: 'Post Property Free',   BN: 'সম্পত্তি পোস্ট করুন' },
  home_cta_btn_call:    { EN: 'Call / WhatsApp Us',   BN: 'কল / হোয়াটসঅ্যাপ করুন' },

  home_cat_flats:       { EN: 'Flats & Apartments',    BN: 'ফ্ল্যাট ও অ্যাপার্টমেন্ট' },
  home_cat_houses:      { EN: 'Houses / Bari',          BN: 'বাড়ি ও ভিলা' },
  home_cat_land:        { EN: 'Land & Plots',           BN: 'জমি ও প্লট' },
  home_cat_mess:        { EN: 'Mess & Hostel',          BN: 'মেস ও হোস্টেল' },
  home_cat_hotels:      { EN: 'Hotels & Short Stay',    BN: 'হোটেল ও রিসোর্ট' },

  // WHY PLOTIFY items
  why1_title: { EN: '100% Direct Owner Contact',      BN: '১০০% সরাসরি মালিকের সাথে যোগাযোগ' },
  why1_desc:  { EN: 'No middlemen. Chat directly with verified owners, developers, and agencies.',
                BN: 'কোনো দালাল নেই। সরাসরি যাচাইকৃত মালিক, ডেভেলপার এবং এজেন্সির সাথে কথা বলুন।' },
  why2_title: { EN: 'Verified & Trusted Listings',    BN: 'যাচাইকৃত ও বিশ্বস্ত তালিকা' },
  why2_desc:  { EN: 'Every listing goes through document & identity checks before going live.',
                BN: 'প্রতিটি বিজ্ঞাপন প্রকাশের আগে সঠিক তথ্য ও নথি পরীক্ষা করা হয়।' },
  why3_title: { EN: 'GPS-Powered Discovery',          BN: 'জিপিএস ভিত্তিক সন্ধান' },
  why3_desc:  { EN: 'Enable location access to instantly find properties near you on a live map.',
                BN: 'লোকেশন চালু করে আপনার আশেপাশের সম্পত্তি সরাসরি ম্যাপে খুঁজে নিন।' },
  why4_title: { EN: 'Ploti AI Assistant',             BN: 'প্লটি এআই স্মার্ট সহকারী' },
  why4_desc:  { EN: 'Ask about prices, Katha conversions, legal checks, and more — in Bangla or English.',
                BN: 'দাম, কাঠা হিসাব ও আইনি তথ্য সংক্রান্ত যেকোনো প্রশ্ন করুন।' },
  why5_title: { EN: 'Instant Listing Activation',     BN: 'দ্রুত বিজ্ঞাপন সক্রিয়করণ' },
  why5_desc:  { EN: 'Pay a small BDT listing fee (Tk 500–5,000) and your ad goes live in minutes.',
                BN: 'স্বল্প তালিকা ফি পরিশোধের পর অল্প সময়ের মধ্যেই আপনার বিজ্ঞাপন লাইভ হবে।' },
  why6_title: { EN: 'Free Market Insights',           BN: 'বাজার বিশ্লেষণের তথ্য' },
  why6_desc:  { EN: 'Track price trends across Gulshan, Bashundhara, Purbachal, and all 64 districts.',
                BN: 'গুলশান, বসুন্ধরা, পূর্বাচলসহ ৬৪ জেলার রিয়েল এস্টেটের দাম যাচাই করুন।' },

  // ── FOOTER ────────────────────────────────────────────────────────────────
  footer_tagline:     { EN: "Bangladesh's premium real estate marketplace for buying, selling, and renting verified properties — with 100% direct owner contact, transparent BDT pricing, and AI-powered assistance.",
                        BN: 'বাংলাদেশের আধুনিক রিয়েল এস্টেট মার্কেটপ্লেস — যাচাইকৃত সম্পত্তি ক্রয়, বিক্রয় ও ভাড়া। সরাসরি মালিক যোগাযোগ, স্বচ্ছ মূল্য এবং এআই সহায়তা।' },
  footer_listings:    { EN: 'Active Listings',  BN: 'সক্রিয় তালিকা' },
  footer_districts:   { EN: 'Districts',        BN: 'জেলা' },
  footer_users:       { EN: 'Monthly Users',    BN: 'মাসিক ব্যবহারকারী' },
  footer_disclaimer:  { EN: '⚠ Zero Liability Notice: Plotify is a listing marketplace and does not participate in, verify, or guarantee the outcome of any property transaction. All listings are user-submitted. Buyers and sellers transact at their own risk.',
                        BN: '⚠ দায়মুক্তি নোটিশ: প্লটিফাই একটি তথ্যভিত্তিক মার্কেটপ্লেস। কোনো আর্থিক লেনদেন বা চুক্তিপত্রে প্লটিফাই সরাসরি অংশ নেয় না। ক্রেতা ও বিক্রেতাকে নিজ দায়িত্বে যাচাই করে লেনদেন করার পরামর্শ দেওয়া হচ্ছে।' },
  footer_explore:     { EN: 'Explore',           BN: 'অন্বেষণ করুন' },
  footer_top_areas:   { EN: 'Top Areas',         BN: 'শীর্ষ এলাকা' },
  footer_contact:     { EN: 'Contact Us',         BN: 'যোগাযোগ' },
  footer_legal:       { EN: 'Legal',              BN: 'আইনি তথ্য' },
  footer_copyright:   { EN: 'Plotify Bangladesh. All rights reserved.', BN: 'প্লটিফাই বাংলাদেশ। সর্বস্বত্ব সংরক্ষিত।' },
  footer_built:       { EN: 'Built with',         BN: 'বাংলাদেশে তৈরি' },
  footer_in_dhaka:    { EN: 'in Dhaka, Bangladesh', BN: '' },

  // Explore links
  footer_flats_sale:  { EN: 'Flats for Sale',  BN: 'বিক্রয়ের জন্য ফ্ল্যাট' },
  footer_rent_dhaka:  { EN: 'Rent in Dhaka',   BN: 'ঢাকায় ভাড়া ফ্ল্যাট' },
  footer_land:        { EN: 'Land & Plots',     BN: 'জমি ও প্লট' },
  footer_mess:        { EN: 'Mess / Sublet',    BN: 'মেস ও সাবলেট' },
  footer_hotel:       { EN: 'Hotel Stays',      BN: 'হোটেল ও রিসোর্ট' },
  footer_post_ad:     { EN: 'Post Free Ad',     BN: 'সম্পত্তি পোস্ট করুন' },

  // Legal links
  footer_privacy:     { EN: 'Privacy Policy',  BN: 'গোপনীয়তা নীতি' },
  footer_terms:       { EN: 'Terms of Service', BN: 'ব্যবহারের শর্তাবলী' },
  footer_refunds:     { EN: 'Refund Policy',    BN: 'রিফান্ড নীতি' },
  footer_admin:       { EN: 'Admin Panel',      BN: 'অ্যাডমিন প্যানেল' },

  // ── ADD PROPERTY / DASHBOARD ──────────────────────────────────────────────
  step_prop_info:     { EN: 'Property Info',       BN: 'সম্পত্তির তথ্য' },
  step_details:       { EN: 'Details & Features',  BN: 'সুযোগ-সুবিধা' },
  step_media_contact: { EN: 'Media & Contact',     BN: 'যোগাযোগ ও ছবি' },
  step_review_pay:    { EN: 'Review & Pay',        BN: 'যাচাই ও পেমেন্ট' },
  post_new_title:     { EN: 'Post New Property',   BN: 'নতুন সম্পত্তি পোস্ট করুন' },
  post_new_sub:       { EN: 'Fill in details to list your property on Plotify',
                        BN: 'প্লটিফাইতে আপনার সম্পত্তি তালিকাভুক্ত করতে নিচের তথ্য পূরণ করুন' },
  form_purpose:       { EN: 'Purpose *',           BN: 'উদ্দেশ্য *' },
  form_category:      { EN: 'Category *',          BN: 'ধরন *' },
  form_title:         { EN: 'Property Title *',    BN: 'বিজ্ঞাপনের শিরোনাম *' },
  form_title_ph:      { EN: 'e.g., Luxury 3-Bed Flat in Gulshan 2',
                        BN: 'যেমন: গুলশান ২-এ বিলাসবহুল ৩ বেডের ফ্ল্যাট' },
  form_desc:          { EN: 'Description *',       BN: 'বিস্তারিত বিবরণ *' },
  form_desc_ph:       { EN: 'Describe your property in detail — amenities, condition, nearby landmarks...',
                        BN: 'আপনার সম্পত্তির বিস্তারিত বিবরণ লিখুন — সুযোগ-সুবিধা, অবস্থা, নিকটবর্তী স্থান...' },
  form_division:      { EN: 'Division *',          BN: 'বিভাগ *' },
  form_district:      { EN: 'District *',          BN: 'জেলা *' },
  form_select_div:    { EN: 'Select Division',     BN: 'বিভাগ নির্বাচন করুন' },
  form_select_dist:   { EN: 'Select District',     BN: 'জেলা নির্বাচন করুন' },
  form_area:          { EN: 'Area / Neighborhood *', BN: 'এলাকা / মহল্লা *' },
  form_area_ph:       { EN: 'e.g. Block D, Road 11, Banani', BN: 'যেমন: ব্লক ডি, রোড ১১, বনানী' },
  form_address:       { EN: 'Full Address *',      BN: 'সম্পূর্ণ ঠিকানা *' },
  form_address_ph:    { EN: 'e.g., Road 71, Block D, Gulshan-2, Dhaka-1212',
                        BN: 'যেমন: বাড়ি ১২, রোড ৭১, ব্লক ডি, গুলশান-২, ঢাকা' },
  form_price:         { EN: 'Price (৳ BDT) *',     BN: 'মূল্য (৳ টাকা) *' },
  form_negotiable:    { EN: 'Price is Negotiable',  BN: 'মূল্য আলোচনা সাপেক্ষ' },
  form_size:          { EN: 'Size *',              BN: 'আয়তন *' },
  form_unit:          { EN: 'Unit',                BN: 'একক' },
  form_bedrooms:      { EN: 'Bedrooms',            BN: 'বেডরুম' },
  form_bathrooms:     { EN: 'Bathrooms',           BN: 'বাথরুম' },
  form_seller_name:   { EN: 'Contact Person Name *', BN: 'যোগাযোগকারীর নাম *' },
  form_seller_phone:  { EN: 'Phone Number *',      BN: 'ফোন নম্বর *' },
  form_seller_type:   { EN: 'I am the *',          BN: 'আমি একজন *' },
  form_next:          { EN: 'Next Step',           BN: 'পরবর্তী ধাপ' },
  form_back:          { EN: 'Back',                BN: 'পেছনে' },
  form_submit:        { EN: 'Submit & Proceed',    BN: 'জমা দিন ও এগিয়ে যান' },
  form_submitted_h2:  { EN: 'Property Submitted!', BN: 'সম্পত্তি সফলভাবে জমা হয়েছে!' },
  form_submitted_p:   { EN: 'Your listing is under review. Once the activation fee is confirmed, it will go live within 24 hours.',
                        BN: 'আপনার বিজ্ঞাপনটি পর্যালোচনার জন্য জমা হয়েছে। ফি যাচাইয়ের পর ২৪ ঘণ্টার মধ্যে এটি লাইভ হবে।' },

  // ── PROPERTIES LISTING PAGE ───────────────────────────────────────────────
  prop_search_ph:     { EN: 'Search area, title...',   BN: 'এলাকা বা শিরোনাম খুঁজুন...' },
  prop_all_purpose:   { EN: 'All Purpose',             BN: 'সকল উদ্দেশ্য' },
  prop_all_cats:      { EN: 'All Categories',          BN: 'সকল ধরন' },
  prop_sort_newest:   { EN: 'Newest',                  BN: 'সর্বশেষ' },
  prop_sort_price_asc:{ EN: 'Price ↑',                 BN: 'কম থেকে বেশি দাম' },
  prop_sort_price_desc:{ EN: 'Price ↓',                BN: 'বেশি থেকে কম দাম' },
  prop_nearby:        { EN: 'Nearby',                  BN: 'কাছের সম্পত্তি' },
  prop_filters:       { EN: 'Filters',                 BN: 'ফিল্টার' },
  prop_clear:         { EN: 'Clear',                   BN: 'মুছে ফেলুন' },
  prop_no_results:    { EN: 'No properties found matching your criteria.',
                        BN: 'আপনার পছন্দের সাথে মেলে এমন কোনো সম্পত্তি পাওয়া যায়নি।' },
} as const;

type DictKey = keyof typeof DICT;

// ─────────────────────────────────────────────────────────────────────────────

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('EN');

  const t = (key: DictKey): string => {
    const entry = DICT[key];
    if (!entry) return key;
    return entry[lang];
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return ctx;
}
