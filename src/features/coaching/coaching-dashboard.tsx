import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Play, Clock, Star, BookOpen, Video, CheckCircle, Lock, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

const sampleCourses = [
  { id: '1', title: 'HSC Physics - Complete Course', instructor: 'Dr. Ahmed Karim', progress: 65, totalLessons: 45, completedLessons: 29, rating: 4.8, students: 1250, thumbnail: '🔬', isEnrolled: true },
  { id: '2', title: 'HSC Chemistry - Organic Masterclass', instructor: 'Prof. Salma Begum', progress: 30, totalLessons: 32, completedLessons: 10, rating: 4.9, students: 890, thumbnail: '⚗️', isEnrolled: true },
  { id: '3', title: 'HSC Higher Math - Calculus to Matrix', instructor: 'Md. Rafiqul Islam', progress: 0, totalLessons: 50, completedLessons: 0, rating: 4.7, students: 2100, thumbnail: '📐', isEnrolled: false },
]

const sampleLessons = [
  { id: '1', title: 'What are Waves?', duration: '15:30', completed: true, locked: false },
  { id: '2', title: 'Types of Waves', duration: '22:45', completed: true, locked: false },
  { id: '3', title: 'Wavelength & Frequency', duration: '18:20', completed: true, locked: false },
  { id: '4', title: 'Sound Waves', duration: '25:10', completed: false, locked: false },
  { id: '5', title: 'Light Waves', duration: '20:00', locked: true, completed: false },
  { id: '6', title: 'Diffraction & Reflection', duration: '28:30', locked: true, completed: false },
]

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }

export function CoachingDashboard() {
  const [selectedCourse, setSelectedCourse] = useState(sampleCourses[0])
  const enrolledCourses = sampleCourses.filter(c => c.isEnrolled)
  const availableCourses = sampleCourses.filter(c => !c.isEnrolled)

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold flex items-center gap-2"><GraduationCap className="h-8 w-8" />Coaching Center</h1>
        <p className="text-muted-foreground mt-1">Learn from expert teachers</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><BookOpen className="h-5 w-5" /></div><div><p className="text-2xl font-bold">{enrolledCourses.length}</p><p className="text-xs text-muted-foreground">Enrolled Courses</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10 text-green-500"><CheckCircle className="h-5 w-5" /></div><div><p className="text-2xl font-bold">39</p><p className="text-xs text-muted-foreground">Completed Lessons</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-500/10 text-purple-500"><Clock className="h-5 w-5" /></div><div><p className="text-2xl font-bold">24h</p><p className="text-xs text-muted-foreground">Learning Time</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-orange-500/10 text-orange-500"><Star className="h-5 w-5" /></div><div><p className="text-2xl font-bold">3</p><p className="text-xs text-muted-foreground">Certificates</p></div></div></CardContent></Card>
      </motion.div>

      <Tabs defaultValue="enrolled">
        <TabsList><TabsTrigger value="enrolled">My Courses</TabsTrigger><TabsTrigger value="explore">Explore</TabsTrigger></TabsList>
        <TabsContent value="enrolled" className="mt-4">
          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="lg:col-span-1 space-y-3">
              {enrolledCourses.map((course) => (
                <Card key={course.id} className={cn('cursor-pointer transition-all hover:shadow-lg', selectedCourse.id === course.id && 'border-primary')} onClick={() => setSelectedCourse(course)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-4xl">{course.thumbnail}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{course.title}</h4>
                        <p className="text-xs text-muted-foreground">{course.instructor}</p>
                        <div className="mt-2"><div className="flex items-center justify-between text-xs mb-1"><span>{course.progress}% complete</span><span>{course.completedLessons}/{course.totalLessons}</span></div><Progress value={course.progress} className="h-1.5" /></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="text-6xl">{selectedCourse.thumbnail}</div>
                    <div className="flex-1">
                      <CardTitle>{selectedCourse.title}</CardTitle>
                      <CardDescription className="mt-1">{selectedCourse.instructor}</CardDescription>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm"><Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /><span>{selectedCourse.rating}</span></div>
                        <span className="text-sm text-muted-foreground">{selectedCourse.students.toLocaleString()} students</span>
                        <span className="text-sm text-muted-foreground">{selectedCourse.totalLessons} lessons</span>
                      </div>
                    </div>
                    <Button><Play className="h-4 w-4 mr-2" />Continue</Button>
                  </div>
                  <Progress value={selectedCourse.progress} className="mt-4" />
                </CardHeader>
                <CardContent>
                  <h4 className="font-medium mb-3">Course Content</h4>
                  <div className="space-y-2">
                    {sampleLessons.map((lesson, index) => (
                      <motion.div key={lesson.id} whileHover={{ x: lesson.locked ? 0 : 4 }}
                        className={cn('flex items-center gap-3 p-3 rounded-lg border transition-all', lesson.locked ? 'opacity-50 bg-muted/30' : 'hover:border-primary/50 cursor-pointer', lesson.completed && 'bg-green-500/5 border-green-500/30')}>
                        <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium', lesson.completed ? 'bg-green-500 text-white' : lesson.locked ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary')}>
                          {lesson.completed ? <CheckCircle className="h-4 w-4" /> : lesson.locked ? <Lock className="h-4 w-4" /> : index + 1}
                        </div>
                        <div className="flex-1"><p className="font-medium">{lesson.title}</p><div className="flex items-center gap-2 mt-0.5"><Video className="h-3 w-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{lesson.duration}</span></div></div>
                        {!lesson.locked && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>
        <TabsContent value="explore" className="mt-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCourses.map((course) => (
              <motion.div key={course.id} variants={itemVariants}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"><span className="text-6xl">{course.thumbnail}</span></div>
                  <CardContent className="p-4">
                    <h4 className="font-medium">{course.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{course.instructor}</p>
                    <div className="flex items-center justify-between mt-3"><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-500 text-yellow-500" /><span className="text-sm">{course.rating}</span></div><span className="text-sm text-muted-foreground">{course.students.toLocaleString()} students</span></div>
                    <Button className="w-full mt-4">Enroll Now</Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
