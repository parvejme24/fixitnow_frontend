import CategoriesSection from "../components/Home/CategoriesSection/CategoriesSection"
import FeaturedServices from "../components/Home/FeaturedServices/FeaturedServices"
import ForTechnicians from "../components/Home/ForTechnicians/ForTechnicians"
import HeroBanner from "../components/Home/HeroBanner/HeroBanner"
import HowItWorks from "../components/Home/HowItWorks/HowItWorks"
import TopTechnicians from "../components/Home/TopTechnicians/TopTechnicians"
import TradeMarquee from "../components/Home/TradeMarquee/TradeMarquee"

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <TradeMarquee />
      <CategoriesSection />
      <FeaturedServices />
      <HowItWorks />
      <TopTechnicians />
      <ForTechnicians />
    </>
  )
}
