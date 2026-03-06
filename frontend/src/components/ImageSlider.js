/**
 * ===============================================================================
 *  IMAGE SLIDER COMPONENT | OeH Wirtschaft Website
 * ===============================================================================
 *
 *  BESCHREIBUNG:
 *  Automatische Diashow mit Swiper.js und Thumbnail Grid.
 *  Zeigt Team- und Campus-Bilder in einer ansprechenden Slideshow.
 *
 * -------------------------------------------------------------------------------
 *  Entwickelt von:     Raphael Boehmer
 *  Unternehmen:        Astra Capital e.U.
 *  Website:            https://astra-capital.eu
 * ===============================================================================
 */

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import { useAssets } from '../hooks/useAsset';
import { ASSET_KEYS } from '../utils/assets';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const SLIDER_ASSETS = [
  ASSET_KEYS.SLIDE_1,
  ASSET_KEYS.SLIDE_2,
  ASSET_KEYS.SLIDE_3,
  ASSET_KEYS.SLIDE_4,
  ASSET_KEYS.SLIDE_5,
  ASSET_KEYS.BG_1,
  ASSET_KEYS.BG_2,
  ASSET_KEYS.BG_3,
  ASSET_KEYS.BG_4,
  ASSET_KEYS.BG_5,
];

const sliderConfig = [
  { key: ASSET_KEYS.SLIDE_1, alt: 'Team Bild 1', position: 'custom', customPosition: '50% 25%' },
  { key: ASSET_KEYS.SLIDE_2, alt: 'Team Bild 2', position: 'top' },
  { key: ASSET_KEYS.SLIDE_3, alt: 'Team Bild 3', position: 'center' },
  { key: ASSET_KEYS.SLIDE_4, alt: 'Team Bild 4', position: 'top' },
  { key: ASSET_KEYS.SLIDE_5, alt: 'Team Bild 5', position: 'center' },
];

const thumbnailConfig = [
  { key: ASSET_KEYS.BG_1, alt: 'Campus 1' },
  { key: ASSET_KEYS.BG_2, alt: 'Campus 2' },
  { key: ASSET_KEYS.BG_3, alt: 'Campus 3' },
  { key: ASSET_KEYS.BG_4, alt: 'Campus 4' },
  { key: ASSET_KEYS.BG_5, alt: 'Campus 5' },
];

export default function ImageSlider() {
  const { assets } = useAssets(SLIDER_ASSETS);

  return (
    <div data-testid="image-slider" className="w-full">
      <div className="relative w-full rounded-xl overflow-hidden shadow-lg mb-2 sm:mb-3">
        <Swiper
          modules={[Autoplay, Pagination, EffectFade]}
          spaceBetween={0}
          slidesPerView={1}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          loop={true}
          className="w-full"
        >
          {sliderConfig.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full aspect-[16/9] sm:aspect-[21/9]">
                {assets[image.key] && (
                  <img
                    src={assets[image.key]}
                    alt={image.alt}
                    className={`w-full h-full object-cover ${
                      image.position === 'top' ? 'object-top' :
                      image.position === 'custom' ? '' : 'object-center'
                    }`}
                    style={image.customPosition ? { objectPosition: image.customPosition } : {}}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        <style>{`
          .swiper-pagination-bullet {
            background: white;
            opacity: 0.6;
            width: 6px;
            height: 6px;
            transition: all 0.3s ease;
          }
          .swiper-pagination-bullet-active {
            opacity: 1;
            background: #3b82f6;
            width: 18px;
            border-radius: 3px;
          }
        `}</style>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {thumbnailConfig.map((image, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
          >
            {assets[image.key] && (
              <img
                src={assets[image.key]}
                alt={image.alt}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
