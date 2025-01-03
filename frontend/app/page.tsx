import Link from "next/link";
import { AcademicCapIcon, ArrowPathIcon, BookOpenIcon, DevicePhoneMobileIcon, DocumentCheckIcon, LightBulbIcon } from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Personalized Content',
    description:
      'Generate courses in the structure, depth, writing style, and medium that you find most suitable for effective learning.',
    icon: BookOpenIcon,
  },
  {
    name: 'Interactive Activities',
    description:
      'Integrate quizzes, exercises, simulations, and games to reinforce learning and make courses more fun!',
    icon: DevicePhoneMobileIcon,
  },
  {
    name: 'Dynamic Courses',
    description:
      'Modify or regenerate parts of a course until it fully aligns with your learning preferences and needs.',
    icon: ArrowPathIcon,
  },
  {
    name: 'MindSpark AI',
    description:
      "Ask MindSpark AI for clarification if something still doesn't make sense and integrate its response onto the page.",
    icon: LightBulbIcon,
  },
  {
    name: 'Accurate Information',
    description:
      "Generated content is evaluated thoroughly in our systems to minimize errors for the best learning experience.",
    icon: DocumentCheckIcon,
  },
  {
    name: 'Support for Educators',
    description:
      "Provide students personalized courses and lessons with standardized learning objectives and assessments.",
    icon: AcademicCapIcon,
  },
]

export default function Home() {
  return (
    <main data-theme="light" className="bg-white">
      <div className="hero h-[70vh] bg-cover bg-center relative" style={{ backgroundImage: 'url("/Hero.jpg")' }}>
        <div className="absolute inset-0 bg-white bg-opacity-30"></div>
        <div className="hero-content text-center absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="max-w-screen-md">
            <span className="text-5xl font-bold">Welcome to </span>
            <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#bf7afa] to-[#57b1fa]">MindSpark</span>
            <p className="py-6 text-xl mb-6">
              Generate high-quality, personalized courses
            </p>
            <Link
                href="/MyCourses"
                className="btn bg-purple-700 btn-ghost text-white hover:bg-purple-500 px-4 py-3 font-semibold rounded-xl"
            >
                Get Started
            </Link>
          </div>
        </div>
      </div>
      <div className="lg:px-24 px-8 text-lg mt-12">
        <p> MindSpark offers high-quality customized courses that make learning more efficient and fun! At MindSpark,
          we believe that personalization and learner-driven education leads to improved outcomes over traditional
          one-size-fits-all learning approaches.
        </p>
      </div>
      <div className="mt-12 text-center">
        <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#d7acfc] to-[#7fc3fa]">
          Personalized Learning, easy as 1, 2, 3!
        </span>
      </div>
      <div>
        <section className="p-6 dark:bg-gray-100 dark:text-gray-800">
          <div className="container mx-auto">
            <div className="grid gap-6 mt-6 lg:grid-cols-3">
              <div className="flex flex-col p-8 space-y-4 dark:bg-gray-50 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg shadow-lg border-8 border-purple-200">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-xl font-bold rounded-full bg-purple-300 dark:text-gray-50">1</div>
                <p className="text-2xl font-semibold">
                  <b>Sign up</b> for access to our personalized course builder based on learning needs.
                </p>
              </div>
              <div className="flex flex-col p-8 space-y-4 dark:bg-gray-50 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg shadow-lg border-8 border-purple-200">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-xl font-bold rounded-full bg-purple-300 dark:text-gray-50">2</div>
                <p className="text-2xl font-semibold">
                  <b>Build</b> your custom course by answering a few questions and providing specifications.
                </p>
              </div>
              <div className="flex flex-col p-8 space-y-4 dark:bg-gray-50 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg shadow-lg border-8 border-purple-200">
                <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 text-xl font-bold rounded-full bg-purple-300 dark:text-gray-50">3</div>
                <p className="text-2xl font-semibold">
                  <b>Accelerate</b> the learning process and watch your skills grow!
                </p>
              </div>
            </div>
          </div>
        </section>
        <div className="mt-12 text-center">
          <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#d7acfc] to-[#7fc3fa]">
            What We Offer!
          </span>
        </div>
        <div className="mt-12 mb-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {features.map((feature) => (
                  <div key={feature.name} className="relative pl-16">
                    <dt className="text-base/7 font-semibold text-gray-900">
                      <div className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-lg bg-purple-700">
                        <feature.icon aria-hidden="true" className="size-6 text-white" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-2 text-base/7 text-gray-600">{feature.description}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 text-3xl font-semibold text-right">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#d7acfc] to-[#7fc3fa]">... and much more!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
